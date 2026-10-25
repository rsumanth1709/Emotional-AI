"""
MindCare AI — Universal File Parser Service
Extracts text, content summaries, and metadata from all uploaded files
(Documents, PDFs, Word DOCX, Text, Code, Spreadsheets, Images, Audio, etc.)
so the LLM and Emotion AI can understand and respond to any uploaded file.
"""
import os
import mimetypes
from typing import Dict, Any, Optional
from loguru import logger

class FileParserService:
    def __init__(self):
        self.max_text_chars = 12000

    def parse_file(self, file_path: str, filename: Optional[str] = None) -> Dict[str, Any]:
        """
        Parses any file and returns a structured dictionary:
        {
            "filename": str,
            "category": "document" | "spreadsheet" | "code" | "image" | "audio" | "generic",
            "summary": str,
            "text": str,
            "face_prediction": dict | None,
            "voice_prediction": dict | None,
            "error": str | None
        }
        """
        if not file_path or not os.path.exists(file_path):
            return {
                "filename": filename or "unknown",
                "category": "generic",
                "summary": "File could not be found or opened",
                "text": "",
                "face_prediction": None,
                "voice_prediction": None,
                "error": "File not found",
            }

        name = filename or os.path.basename(file_path)
        ext = os.path.splitext(name)[1].lower()
        file_size_kb = round(os.path.getsize(file_path) / 1024, 1)

        result: Dict[str, Any] = {
            "filename": name,
            "category": "generic",
            "summary": f"File: {name} ({file_size_kb} KB)",
            "text": "",
            "face_prediction": None,
            "voice_prediction": None,
            "error": None,
        }

        try:
            # 1. PDF Documents
            if ext == ".pdf":
                return self._parse_pdf(file_path, name, file_size_kb)

            # 2. Word Documents (.docx)
            elif ext in [".docx", ".doc"]:
                return self._parse_docx(file_path, name, file_size_kb)

            # 3. Spreadsheets / Tabular data (.csv, .tsv, .xlsx, .xls)
            elif ext in [".csv", ".tsv", ".xlsx", ".xls"]:
                return self._parse_spreadsheet(file_path, name, ext, file_size_kb)

            # 4. Images (.jpg, .jpeg, .png, .webp, .gif, .bmp, .svg)
            elif ext in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg"]:
                return self._parse_image(file_path, name, file_size_kb)

            # 5. Audio (.wav, .mp3, .ogg, .m4a, .aac, .flac)
            elif ext in [".wav", ".mp3", ".ogg", ".m4a", ".aac", ".flac", ".webm"]:
                return self._parse_audio(file_path, name, file_size_kb)

            # 6. Text / Code / Markdown / JSON / Config files
            elif ext in [
                ".txt", ".md", ".markdown", ".json", ".xml", ".yaml", ".yml",
                ".html", ".css", ".js", ".jsx", ".ts", ".tsx", ".py", ".java",
                ".c", ".cpp", ".cs", ".go", ".rs", ".sql", ".sh", ".bat", ".ps1",
                ".env", ".log", ".ini", ".cfg", ".toml", ".rst"
            ]:
                return self._parse_text_file(file_path, name, ext, file_size_kb)

            # 7. Fallback: Attempt text decode, otherwise return metadata
            else:
                return self._parse_fallback(file_path, name, file_size_kb)

        except Exception as exc:
            logger.error(f"Error parsing uploaded file '{name}': {exc}")
            result["error"] = str(exc)
            result["summary"] = f"File {name} ({file_size_kb} KB) attached. Note: automatic extraction encountered: {exc}"
            return result

    def _parse_pdf(self, file_path: str, name: str, size_kb: float) -> Dict[str, Any]:
        import pypdf
        reader = pypdf.PdfReader(file_path)
        num_pages = len(reader.pages)
        extracted = []

        for idx, page in enumerate(reader.pages[:30]):
            txt = page.extract_text() or ""
            if txt.strip():
                extracted.append(f"--- Page {idx + 1} ---\n{txt.strip()}")

        full_text = "\n\n".join(extracted)
        if len(full_text) > self.max_text_chars:
            full_text = full_text[:self.max_text_chars] + f"\n\n[...Content truncated after {self.max_text_chars} characters...]"

        return {
            "filename": name,
            "category": "document",
            "summary": f"PDF Document: '{name}' ({num_pages} pages, {size_kb} KB)",
            "text": full_text or "[PDF contains scanned images or no selectable text]",
            "face_prediction": None,
            "voice_prediction": None,
            "error": None,
        }

    def _parse_docx(self, file_path: str, name: str, size_kb: float) -> Dict[str, Any]:
        import docx
        doc = docx.Document(file_path)
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        
        # Also grab table cells
        table_rows = []
        for table in doc.tables[:5]:
            for row in table.rows[:20]:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    table_rows.append(row_text)

        all_text = "\n\n".join(paragraphs)
        if table_rows:
            all_text += "\n\n[Tables / Data in Document]:\n" + "\n".join(table_rows)

        if len(all_text) > self.max_text_chars:
            all_text = all_text[:self.max_text_chars] + f"\n\n[...Content truncated after {self.max_text_chars} characters...]"

        return {
            "filename": name,
            "category": "document",
            "summary": f"Word Document: '{name}' ({len(paragraphs)} paragraphs, {size_kb} KB)",
            "text": all_text or "[Document contains no text]",
            "face_prediction": None,
            "voice_prediction": None,
            "error": None,
        }

    def _parse_spreadsheet(self, file_path: str, name: str, ext: str, size_kb: float) -> Dict[str, Any]:
        import pandas as pd
        if ext in [".csv", ".tsv"]:
            sep = "\t" if ext == ".tsv" else ","
            df = pd.read_csv(file_path, sep=sep, nrows=100)
        else:
            df = pd.read_excel(file_path, nrows=100)

        rows, cols = df.shape
        col_list = list(df.columns)
        head_preview = df.head(10).to_string(index=False)

        summary_text = (
            f"Spreadsheet Data ({rows} rows previewed, {cols} columns: {', '.join(str(c) for c in col_list[:15])}):\n\n"
            f"{head_preview}"
        )

        return {
            "filename": name,
            "category": "spreadsheet",
            "summary": f"Spreadsheet: '{name}' ({rows} rows, {cols} columns, {size_kb} KB)",
            "text": summary_text,
            "face_prediction": None,
            "voice_prediction": None,
            "error": None,
        }

    def _parse_text_file(self, file_path: str, name: str, ext: str, size_kb: float) -> Dict[str, Any]:
        content = ""
        for enc in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
            try:
                with open(file_path, "r", encoding=enc) as f:
                    content = f.read()
                break
            except Exception:
                continue

        line_count = len(content.splitlines()) if content else 0
        if len(content) > self.max_text_chars:
            content = content[:self.max_text_chars] + f"\n\n[...Content truncated after {self.max_text_chars} characters...]"

        cat = "code" if ext in [".py", ".js", ".ts", ".tsx", ".jsx", ".html", ".css", ".sql", ".go", ".rs"] else "document"
        return {
            "filename": name,
            "category": cat,
            "summary": f"{cat.capitalize()} File: '{name}' ({line_count} lines, {size_kb} KB)",
            "text": content or "[File is empty]",
            "face_prediction": None,
            "voice_prediction": None,
            "error": None,
        }

    def _parse_image(self, file_path: str, name: str, size_kb: float) -> Dict[str, Any]:
        from PIL import Image
        face_pred = None
        img_info = ""

        try:
            with Image.open(file_path) as img:
                width, height = img.size
                img_format = img.format or "Image"
                img_info = f"{img_format} {width}x{height} px"
        except Exception as e:
            img_info = f"Image ({size_kb} KB)"

        # Check facial emotion if face detector is available
        try:
            from app.ai.face_emotion_detector import face_emotion_detector
            face_pred = face_emotion_detector.detect(file_path)
        except Exception as e:
            logger.debug(f"Face emotion detector skipped: {e}")

        summary = f"Image File: '{name}' ({img_info}, {size_kb} KB)"
        desc = f"User uploaded an image file ({img_info})."
        if face_pred:
            emotion = face_pred.get("emotion", "Unknown")
            confidence = int(face_pred.get("confidence", 0.8) * 100)
            desc += f" Facial expression analysis detected emotion '{emotion}' with {confidence}% confidence."

        return {
            "filename": name,
            "category": "image",
            "summary": summary,
            "text": desc,
            "face_prediction": face_pred,
            "voice_prediction": None,
            "error": None,
        }

    def _parse_audio(self, file_path: str, name: str, size_kb: float) -> Dict[str, Any]:
        transcript = ""
        voice_pred = None

        try:
            from app.ai.speech_translator import speech_translator
            transcript = speech_translator.transcribe(file_path) or ""
        except Exception as e:
            logger.debug(f"Audio transcription skipped: {e}")

        try:
            from app.ai.voice_emotion_detector import voice_emotion_detector
            voice_pred = voice_emotion_detector.detect(file_path)
        except Exception as e:
            logger.debug(f"Voice emotion detection skipped: {e}")

        summary = f"Audio Recording: '{name}' ({size_kb} KB)"
        text_content = ""
        if transcript.strip():
            text_content = f"Spoken Audio Transcript:\n\"{transcript.strip()}\""
        else:
            text_content = f"Audio check-in recording ({size_kb} KB)."

        if voice_pred:
            emotion = voice_pred.get("emotion", "Neutral")
            text_content += f"\nAcoustic tone detected: {emotion}."

        return {
            "filename": name,
            "category": "audio",
            "summary": summary,
            "text": text_content,
            "face_prediction": None,
            "voice_prediction": voice_pred,
            "error": None,
        }

    def _parse_fallback(self, file_path: str, name: str, size_kb: float) -> Dict[str, Any]:
        # Try reading the first 4KB as plain text
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                sample = f.read(4000)
                # If mostly printable characters, treat as text
                printable = sum(1 for c in sample if c.isprintable() or c in "\r\n\t")
                if len(sample) > 0 and (printable / len(sample)) > 0.8:
                    return {
                        "filename": name,
                        "category": "document",
                        "summary": f"File: '{name}' ({size_kb} KB)",
                        "text": sample,
                        "face_prediction": None,
                        "voice_prediction": None,
                        "error": None,
                    }
        except Exception:
            pass

        mime_type, _ = mimetypes.guess_type(name)
        return {
            "filename": name,
            "category": "generic",
            "summary": f"Attached File: '{name}' ({mime_type or 'binary file'}, {size_kb} KB)",
            "text": f"User attached a file named '{name}' ({size_kb} KB, type: {mime_type or 'binary file'}).",
            "face_prediction": None,
            "voice_prediction": None,
            "error": None,
        }

file_parser_service = FileParserService()
