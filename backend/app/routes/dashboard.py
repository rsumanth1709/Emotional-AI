"""
MindCare AI — Dashboard & Analytics Routes
"""
from collections import Counter
from datetime import date, datetime, timedelta
from typing import Annotated, List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.chat import Chat
from app.models.emotion import EmotionRecord
from app.models.user import User
from app.schemas.chat import ChatHistoryItem
from app.schemas.dashboard import (
    AnalyticsResponse,
    DashboardResponse,
    DashboardStats,
    EmotionDistribution,
    MonthlyTrend,
    WeeklyMood,
    HourlyMood,
    HeatmapDay,
    StreakStats,
)
from app.services.emotion_service import emotion_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]

_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def _emotion_to_mood(emotion: str) -> float:
    """Convert an emotion category to a mood score (0–10, 10 = best)."""
    mapping = {
        "Happy": 9.0, "Excited": 8.5, "Hopeful": 8.0,
        "Neutral": 5.5, "Lonely": 4.0, "Stress": 3.5,
        "Sad": 3.0, "Fear": 2.5, "Anxiety": 2.0, "Angry": 2.0,
    }
    return mapping.get(emotion, 5.0)


def _build_emotion_distribution(records: List[EmotionRecord]) -> List[EmotionDistribution]:
    if not records:
        return []
    counter = Counter(r.emotion for r in records)
    total = len(records)
    return [
        EmotionDistribution(
            emotion=emotion,
            count=count,
            percentage=round(count / total * 100, 1),
        )
        for emotion, count in counter.most_common()
    ]


def _build_weekly_mood(records: List[EmotionRecord]) -> List[WeeklyMood]:
    """Aggregate emotion records into the past 7 days of mood scores."""
    today = date.today()
    result = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_records = [
            r for r in records
            if r.recorded_at.date() == day
        ]
        if day_records:
            emotions = [r.emotion for r in day_records]
            dominant = Counter(emotions).most_common(1)[0][0]
            avg_mood = sum(_emotion_to_mood(e) for e in emotions) / len(emotions)
        else:
            dominant = "Neutral"
            avg_mood = 5.0
        result.append(WeeklyMood(
            day=day.strftime("%a"),
            mood_score=round(avg_mood, 1),
            dominant_emotion=dominant,
        ))
    return result


def _build_monthly_trend(records: List[EmotionRecord]) -> List[MonthlyTrend]:
    """Aggregate into daily mood scores over the past 30 days."""
    today = date.today()
    result = []
    for i in range(29, -1, -1):
        day = today - timedelta(days=i)
        day_records = [r for r in records if r.recorded_at.date() == day]
        if day_records:
            avg_mood = sum(_emotion_to_mood(r.emotion) for r in day_records) / len(day_records)
        else:
            avg_mood = 5.0
        result.append(MonthlyTrend(date=day.isoformat(), mood_score=round(avg_mood, 1)))
    return result


def _build_hourly_mood(records: List[EmotionRecord]) -> List[HourlyMood]:
    """Group today's emotion records by hour (00:00 to 23:00)."""
    today = date.today()
    today_records = [r for r in records if r.recorded_at.date() == today]
    result = []
    for h in range(24):
        hour_str = f"{h:02d}:00"
        hour_records = [r for r in today_records if r.recorded_at.hour == h]
        if hour_records:
            emotions = [r.emotion for r in hour_records]
            dominant = Counter(emotions).most_common(1)[0][0]
            avg_mood = sum(_emotion_to_mood(e) for e in emotions) / len(emotions)
            result.append(HourlyMood(
                hour=hour_str,
                mood_score=round(avg_mood, 1),
                dominant_emotion=dominant
            ))
    return result


def _build_calendar_heatmap(records: List[EmotionRecord]) -> List[HeatmapDay]:
    """Aggregate emotion records by date for the past 90 days."""
    today = date.today()
    result = []
    for i in range(89, -1, -1):
        day = today - timedelta(days=i)
        day_records = [r for r in records if r.recorded_at.date() == day]
        if day_records:
            avg_mood = sum(_emotion_to_mood(r.emotion) for r in day_records) / len(day_records)
            count = len(day_records)
        else:
            avg_mood = 0.0
            count = 0
        result.append(HeatmapDay(
            date=day.isoformat(),
            mood_score=round(avg_mood, 1),
            count=count
        ))
    return result


def _compute_streak_stats(records: List[EmotionRecord]) -> StreakStats:
    """Calculate the current and longest consecutive day streaks of logging."""
    if not records:
        return StreakStats(current_streak=0, longest_streak=0)
    
    unique_dates = sorted(list(set(r.recorded_at.date() for r in records)))
    if not unique_dates:
        return StreakStats(current_streak=0, longest_streak=0)
    
    longest = 0
    current_temp = 0
    prev_date = None
    
    for d in unique_dates:
        if prev_date is None:
            current_temp = 1
        elif (d - prev_date).days == 1:
            current_temp += 1
        elif (d - prev_date).days > 1:
            if current_temp > longest:
                longest = current_temp
            current_temp = 1
        prev_date = d
    if current_temp > longest:
        longest = current_temp
        
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    has_today = today in unique_dates
    has_yesterday = yesterday in unique_dates
    
    if not has_today and not has_yesterday:
        current = 0
    else:
        current = 0
        check_date = today if has_today else yesterday
        while check_date in unique_dates:
            current += 1
            check_date -= timedelta(days=1)
            
    return StreakStats(current_streak=current, longest_streak=max(current, longest))


def _compute_improvement_score(records: List[EmotionRecord]) -> float:
    """Compare the average mood score of the past 7 days against the previous 7 days."""
    today = date.today()
    this_week_start = today - timedelta(days=6)
    last_week_start = today - timedelta(days=13)
    
    this_week_records = [
        r for r in records 
        if this_week_start <= r.recorded_at.date() <= today
    ]
    last_week_records = [
        r for r in records 
        if last_week_start <= r.recorded_at.date() < this_week_start
    ]
    
    this_week_avg = (
        sum(_emotion_to_mood(r.emotion) for r in this_week_records) / len(this_week_records)
        if this_week_records else 5.0
    )
    last_week_avg = (
        sum(_emotion_to_mood(r.emotion) for r in last_week_records) / len(last_week_records)
        if last_week_records else 5.0
    )
    
    if last_week_avg == 0:
        return 0.0
    delta = ((this_week_avg - last_week_avg) / last_week_avg) * 100
    return round(delta, 1)


def _compute_volatility_score(records: List[EmotionRecord]) -> float:
    """Calculate emotional volatility (standard deviation of mood scores over past 30 days)."""
    today = date.today()
    since = today - timedelta(days=29)
    records_30d = [r for r in records if since <= r.recorded_at.date() <= today]
    if not records_30d:
        return 0.0
    
    daily_scores = {}
    for r in records_30d:
        d = r.recorded_at.date()
        daily_scores.setdefault(d, []).append(_emotion_to_mood(r.emotion))
        
    daily_avgs = [sum(scores)/len(scores) for scores in daily_scores.values()]
    if len(daily_avgs) < 2:
        return 0.0
        
    mean = sum(daily_avgs) / len(daily_avgs)
    variance = sum((x - mean) ** 2 for x in daily_avgs) / (len(daily_avgs) - 1)
    std_dev = variance ** 0.5
    return round(std_dev, 2)


@router.get("", response_model=DashboardResponse)
def get_dashboard(current_user: CurrentUser, db: DBDep):
    """Return full dashboard data for the authenticated user."""
    # Fetch data
    records_30d = emotion_service.get_emotion_history(db, current_user.id, days=30)
    recent_chats = (
        db.query(Chat)
        .filter(Chat.user_id == current_user.id, Chat.role == "user")
        .order_by(Chat.created_at.desc())
        .limit(5)
        .all()
    )
    total_chats = db.query(Chat).filter(Chat.user_id == current_user.id).count()
    wellness = emotion_service.compute_wellness_score(db, current_user.id)

    # Today's emotion
    today_records = [r for r in records_30d if r.recorded_at.date() == date.today()]
    today_emotion = Counter(r.emotion for r in today_records).most_common(1)
    today_emotion_str = today_emotion[0][0] if today_emotion else "Neutral"

    # Stats
    most_freq = Counter(r.emotion for r in records_30d).most_common(1)
    most_freq_emotion = most_freq[0][0] if most_freq else "Neutral"
    avg_stress = (
        sum(r.stress_score for r in records_30d) / len(records_30d)
        if records_30d else 3.0
    )
    avg_mood = _emotion_to_mood(most_freq_emotion)

    return DashboardResponse(
        stats=DashboardStats(
            total_chats=total_chats,
            avg_mood_score=round(avg_mood, 1),
            most_frequent_emotion=most_freq_emotion,
            current_stress_level=round(avg_stress, 1),
            mental_wellness_score=round(wellness, 1),
        ),
        today_emotion=today_emotion_str,
        emotion_distribution=_build_emotion_distribution(records_30d),
        weekly_mood=_build_weekly_mood(records_30d),
        monthly_trend=_build_monthly_trend(records_30d),
        recent_chats=[ChatHistoryItem.model_validate(c) for c in recent_chats],
    )


@analytics_router.get("", response_model=AnalyticsResponse)
def get_analytics(current_user: CurrentUser, db: DBDep):
    """Detailed analytics data for the analytics page."""
    records = emotion_service.get_emotion_history(db, current_user.id, days=90)
    total_sessions = len(set(
        c.session_id for c in
        db.query(Chat).filter(Chat.user_id == current_user.id).all()
    ))
    avg_stress = sum(r.stress_score for r in records) / len(records) if records else 3.0
    most_freq = Counter(r.emotion for r in records).most_common(1)
    most_freq_emotion = most_freq[0][0] if most_freq else "Neutral"
    avg_mood = _emotion_to_mood(most_freq_emotion)

    return AnalyticsResponse(
        emotion_distribution=_build_emotion_distribution(records),
        weekly_mood=_build_weekly_mood(records),
        monthly_trend=_build_monthly_trend(records),
        hourly_mood=_build_hourly_mood(records),
        calendar_heatmap=_build_calendar_heatmap(records),
        streak_stats=_compute_streak_stats(records),
        improvement_score=_compute_improvement_score(records),
        volatility_score=_compute_volatility_score(records),
        total_sessions=total_sessions,
        avg_stress=round(avg_stress, 1),
        avg_mood=round(avg_mood, 1),
        most_frequent_emotion=most_freq_emotion,
    )
