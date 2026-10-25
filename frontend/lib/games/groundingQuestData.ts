/**
 * MindCare AI — Somatic Grounding Quest Dataset & Sensory Environments
 * 
 * Clinical 5-4-3-2-1 Sensory Grounding Technique designed to interrupt
 * amygdala hijack, dissociation, and acute sympathetic panic.
 */

export type GroundingRealmId = "forest" | "cabin" | "ocean" | "real_world";

export interface SensoryAnchor {
  id: string;
  sense: "see" | "touch" | "hear" | "smell" | "taste";
  prompt: string;
  hint: string;
  iconName: string;
}

export interface SensoryStage {
  stageNumber: number; // 5, 4, 3, 2, 1
  sense: "see" | "touch" | "hear" | "smell" | "taste";
  senseLabel: string;
  itemCount: number;
  instruction: string;
  clinicalPurpose: string;
  items: SensoryAnchor[];
}

export interface GroundingRealm {
  id: GroundingRealmId;
  name: string;
  subtitle: string;
  description: string;
  themeGradient: string;
  ambientToneHz: number;
  stages: Record<number, SensoryStage>;
}

export const GROUNDING_REALMS: Record<GroundingRealmId, GroundingRealm> = {
  forest: {
    id: "forest",
    name: "Bioluminescent Forest",
    subtitle: "Ancient pines • Glowing flora • Mountain mist",
    description: "Immerse your senses in a calming twilight canopy. Awaken present-moment orientation through earth, moss, and cool air.",
    themeGradient: "from-emerald-950 via-teal-950 to-slate-950",
    ambientToneHz: 174, // Solfeggio frequency for somatic safety
    stages: {
      5: {
        stageNumber: 5,
        sense: "see",
        senseLabel: "Sight (Visual Orientation)",
        itemCount: 5,
        instruction: "Notice 5 distinct visual details in this serene twilight grove.",
        clinicalPurpose: "Engages the visual cortex to orient physical reality and disrupt internal threat loops.",
        items: [
          { id: "for-s1", sense: "see", prompt: "Soft cyan glow shimmering on damp tree roots", hint: "Look along the forest floor", iconName: "Eye" },
          { id: "for-s2", sense: "see", prompt: "Delicate veins on a velvet fern leaf", hint: "Observe the intricate natural geometry", iconName: "Eye" },
          { id: "for-s3", sense: "see", prompt: "Dewdrops reflecting the silver moonbeam", hint: "Find tiny points of light", iconName: "Eye" },
          { id: "for-s4", sense: "see", prompt: "Subtle rings on a moss-covered boulder", hint: "Notice the ancient weathering patterns", iconName: "Eye" },
          { id: "for-s5", sense: "see", prompt: "A slow canopy leaf gently drifting downward", hint: "Track the peaceful descent", iconName: "Eye" },
        ],
      },
      4: {
        stageNumber: 4,
        sense: "touch",
        senseLabel: "Touch (Tactile Grounding)",
        itemCount: 4,
        instruction: "Feel 4 physical textures grounding you to the earth.",
        clinicalPurpose: "Activates tactile mechanoreceptors, sending signals of physical containment to the brainstem.",
        items: [
          { id: "for-t1", sense: "touch", prompt: "Rough, sturdy bark of an ancient cedar tree", hint: "Feel the solid ridges under your fingertips", iconName: "Hand" },
          { id: "for-t2", sense: "touch", prompt: "Cool, springy cushion of damp forest moss", hint: "Notice the soft, moisture-rich texture", iconName: "Hand" },
          { id: "for-t3", sense: "touch", prompt: "Smooth, chilled surface of a river pebble", hint: "Feel the temperature and weight", iconName: "Hand" },
          { id: "for-t4", sense: "touch", prompt: "A gentle mountain breeze brushing across your wrists", hint: "Feel the ambient air movement", iconName: "Hand" },
        ],
      },
      3: {
        stageNumber: 3,
        sense: "hear",
        senseLabel: "Hearing (Auditory Presence)",
        itemCount: 3,
        instruction: "Listen for 3 layers of ambient forest sound.",
        clinicalPurpose: "Directs auditory attention away from cognitive chatter toward environmental reality.",
        items: [
          { id: "for-h1", sense: "hear", prompt: "Soft rustle of wind through high pine needles", hint: "Tune into the continuous soothing whoosh", iconName: "Ear" },
          { id: "for-h2", sense: "hear", prompt: "Gentle trickle of a distant glacial creek", hint: "Listen for rhythmic water bubbling", iconName: "Ear" },
          { id: "for-h3", sense: "hear", prompt: "A distant nightingale's clear, peaceful trill", hint: "Notice the melody fading into silence", iconName: "Ear" },
        ],
      },
      2: {
        stageNumber: 2,
        sense: "smell",
        senseLabel: "Smell (Olfactory Reset)",
        itemCount: 2,
        instruction: "Breathe in deeply and notice 2 natural woodland scents.",
        clinicalPurpose: "The olfactory nerve directly accesses the limbic system, rapidly shifting emotional valence.",
        items: [
          { id: "for-m1", sense: "smell", prompt: "Crisp scent of damp earth and fallen autumn pine needles (Petrichor)", hint: "Inhale the grounded, mineral-rich fragrance", iconName: "Wind" },
          { id: "for-m2", sense: "smell", prompt: "Clean, fresh evergreen resin carried on cold mountain air", hint: "Notice the sharp, refreshing pine aroma", iconName: "Wind" },
        ],
      },
      1: {
        stageNumber: 1,
        sense: "taste",
        senseLabel: "Taste & Center (Somatic Integration)",
        itemCount: 1,
        instruction: "Ground your core: take a mindful sip of water or repeat this centering truth.",
        clinicalPurpose: "Triggers the swallow reflex to stimulate the vagus nerve and anchor safety.",
        items: [
          { id: "for-k1", sense: "taste", prompt: "A cool sip of mountain spring water: 'I am safe in this moment. My feet are grounded, my breath is steady.'", hint: "Feel the cool hydration moving down your throat", iconName: "Smile" },
        ],
      },
    },
  },

  cabin: {
    id: "cabin",
    name: "Cozy Rain Cabin",
    subtitle: "Cedar hearth • Pattering rain • Warm tea",
    description: "Shelter from the storm inside a warm rustic sanctuary. Awaken cozy sensory safety beside a glowing stone hearth.",
    themeGradient: "from-amber-950 via-orange-950 to-slate-950",
    ambientToneHz: 216, // Calming warmth
    stages: {
      5: {
        stageNumber: 5,
        sense: "see",
        senseLabel: "Sight (Visual Orientation)",
        itemCount: 5,
        instruction: "Notice 5 comforting visual details in your warm cabin shelter.",
        clinicalPurpose: "Visual orientation toward warmth and shelter signals safety to the autonomic nervous system.",
        items: [
          { id: "cab-s1", sense: "see", prompt: "Gentle dance of amber flames in the stone fireplace", hint: "Watch the flicker of embers", iconName: "Eye" },
          { id: "cab-s2", sense: "see", prompt: "Rain droplets racing smoothly down the steamy window glass", hint: "Observe the slow water trails", iconName: "Eye" },
          { id: "cab-s3", sense: "see", prompt: "Soft curls of steam rising from a ceramic mug", hint: "Track the delicate vapor swirls", iconName: "Eye" },
          { id: "cab-s4", sense: "see", prompt: "Rich wood-grain whorls on the hand-hewn oak table", hint: "Notice the dark natural patterns", iconName: "Eye" },
          { id: "cab-s5", sense: "see", prompt: "Warm wool weave of a thick knitted throw blanket", hint: "Look at the cozy interlaced yarn", iconName: "Eye" },
        ],
      },
      4: {
        stageNumber: 4,
        sense: "touch",
        senseLabel: "Touch (Tactile Grounding)",
        itemCount: 4,
        instruction: "Feel 4 physical sensations of warmth and comfort.",
        clinicalPurpose: "Warm tactile input releases oxytocin and soothes somatic tension.",
        items: [
          { id: "cab-t1", sense: "touch", prompt: "Radiant warmth of the ceramic mug cradled in both hands", hint: "Notice heat spreading into palms and fingers", iconName: "Hand" },
          { id: "cab-t2", sense: "touch", prompt: "Weight of the thick wool blanket resting across your lap", hint: "Feel the gentle, grounding downward pressure", iconName: "Hand" },
          { id: "cab-t3", sense: "touch", prompt: "Firm wooden floor supporting the soles of your feet", hint: "Feel the solid foundation underneath", iconName: "Hand" },
          { id: "cab-t4", sense: "touch", prompt: "Warm, dry hearth air caressing your face", hint: "Notice contrast with the cold storm outside", iconName: "Hand" },
        ],
      },
      3: {
        stageNumber: 3,
        sense: "hear",
        senseLabel: "Hearing (Auditory Presence)",
        itemCount: 3,
        instruction: "Tune into 3 rhythmic, comforting cabin sounds.",
        clinicalPurpose: "Pink noise from rain and fires stabilizes erratic neural oscillations.",
        items: [
          { id: "cab-h1", sense: "hear", prompt: "Rhythmic patter of gentle rain drumming against the tin roof", hint: "Tune into the steady ambient rhythm", iconName: "Ear" },
          { id: "cab-h2", sense: "hear", prompt: "Soft pop and crackle of seasoned cedar wood in the hearth", hint: "Listen for the warm occasional spark", iconName: "Ear" },
          { id: "cab-h3", sense: "hear", prompt: "Gentle whistle of the wind safely muffled outside the cabin walls", hint: "Feel how secure you are inside", iconName: "Ear" },
        ],
      },
      2: {
        stageNumber: 2,
        sense: "smell",
        senseLabel: "Smell (Olfactory Reset)",
        itemCount: 2,
        instruction: "Notice 2 heartwarming aromas filling the room.",
        clinicalPurpose: "Spicy and woody aromas activate parasympathetic digestion and relaxation.",
        items: [
          { id: "cab-m1", sense: "smell", prompt: "Sweet aroma of cinnamon and dried chamomile blossoms steeping in hot water", hint: "Inhale the warm herbal bouquet", iconName: "Wind" },
          { id: "cab-m2", sense: "smell", prompt: "Warm, dry scent of burning birchwood and toasted cedar", hint: "Notice the comforting smokiness", iconName: "Wind" },
        ],
      },
      1: {
        stageNumber: 1,
        sense: "taste",
        senseLabel: "Taste & Center (Somatic Integration)",
        itemCount: 1,
        instruction: "Savor a warm sensation: take a mindful sip or repeat this anchor.",
        clinicalPurpose: "Grounds the physical body in present nourishment and emotional containment.",
        items: [
          { id: "cab-k1", sense: "taste", prompt: "A comforting sip of spiced honey tea: 'The storm is outside; I am sheltered, warm, and at peace within.'", hint: "Taste the gentle warmth on your tongue", iconName: "Smile" },
        ],
      },
    },
  },

  ocean: {
    id: "ocean",
    name: "Ocean Cliff Horizon",
    subtitle: "Crashing surf • Salt breeze • Open sky",
    description: "Stand atop an expansive coastal cliff. Let the vast rhythm of the tides dissolve cognitive claustrophobia and tension.",
    themeGradient: "from-blue-950 via-cyan-950 to-slate-950",
    ambientToneHz: 136.1, // Earth year / Om resonance frequency
    stages: {
      5: {
        stageNumber: 5,
        sense: "see",
        senseLabel: "Sight (Visual Orientation)",
        itemCount: 5,
        instruction: "Notice 5 expansive visual landmarks across the coastal expanse.",
        clinicalPurpose: "Panoramic vision (optic flow) directly calms the sympathetic ocular reflex.",
        items: [
          { id: "oce-s1", sense: "see", prompt: "Vast, unbroken horizon where deep indigo ocean meets pale sky", hint: "Look as far into the distance as you can", iconName: "Eye" },
          { id: "oce-s2", sense: "see", prompt: "White cresting sea-foam rolling gently onto smooth sand below", hint: "Follow the wave as it breaks and dissolves", iconName: "Eye" },
          { id: "oce-s3", sense: "see", prompt: "Sunlight glinting like diamonds across the rolling swells", hint: "Notice the bright sparkling reflections", iconName: "Eye" },
          { id: "oce-s4", sense: "see", prompt: "A solitary sea-bird gliding effortlessly on warm thermal currents", hint: "Observe the effortless, wings-spread soaring", iconName: "Eye" },
          { id: "oce-s5", sense: "see", prompt: "Smooth, weathered grey granite of the cliff face", hint: "Notice how firm and permanent the stone is", iconName: "Eye" },
        ],
      },
      4: {
        stageNumber: 4,
        sense: "touch",
        senseLabel: "Touch (Tactile Grounding)",
        itemCount: 4,
        instruction: "Feel 4 tactile sensations connecting you to the coast.",
        clinicalPurpose: "Grounds awareness in physical elements of air, rock, and sun.",
        items: [
          { id: "oce-t1", sense: "touch", prompt: "Brisk, invigorating ocean breeze against your cheeks and hair", hint: "Feel the coolness across your skin", iconName: "Hand" },
          { id: "oce-t2", sense: "touch", prompt: "Sun-warmed granite beneath your hands", hint: "Feel the solid, reassuring stone beneath you", iconName: "Hand" },
          { id: "oce-t3", sense: "touch", prompt: "Gentle mist of sea spray settling lightly on your arms", hint: "Notice the micro-droplets evaporating", iconName: "Hand" },
          { id: "oce-t4", sense: "touch", prompt: "Firm, level earth supporting your balanced stance", hint: "Feel your core grounded and stable", iconName: "Hand" },
        ],
      },
      3: {
        stageNumber: 3,
        sense: "hear",
        senseLabel: "Hearing (Auditory Presence)",
        itemCount: 3,
        instruction: "Listen to 3 oceanic rhythms echoing from the water.",
        clinicalPurpose: "Tidal ocean frequencies (0.1 Hz) match natural human autonomic rhythms.",
        items: [
          { id: "oce-h1", sense: "hear", prompt: "Deep, rhythmic roar of a wave crashing against the shoreline", hint: "Feel the low-frequency rumble in your chest", iconName: "Ear" },
          { id: "oce-h2", sense: "hear", prompt: "Soft hiss of water and smooth pebbles receding with the backwash", hint: "Listen for the gentle tumbling stones", iconName: "Ear" },
          { id: "oce-h3", sense: "hear", prompt: "Distant call of coastal gulls echoing over the open water", hint: "Notice how wide the sound feels in space", iconName: "Ear" },
        ],
      },
      2: {
        stageNumber: 2,
        sense: "smell",
        senseLabel: "Smell (Olfactory Reset)",
        itemCount: 2,
        instruction: "Inhale 2 refreshing coastal scents on the breeze.",
        clinicalPurpose: "Negative marine ions stimulate alpha brainwaves and oxygen absorption.",
        items: [
          { id: "oce-m1", sense: "smell", prompt: "Clean, mineral-rich sea salt carried on the marine mist", hint: "Inhale the crisp, invigorating sea air", iconName: "Wind" },
          { id: "oce-m2", sense: "smell", prompt: "Earthy, sun-warmed wild rosemary growing along the cliff edge", hint: "Notice the fragrant herb aroma", iconName: "Wind" },
        ],
      },
      1: {
        stageNumber: 1,
        sense: "taste",
        senseLabel: "Taste & Center (Somatic Integration)",
        itemCount: 1,
        instruction: "Anchor your core with this grounding affirmation.",
        clinicalPurpose: "Anchors psychological sovereignty amidst life's shifting emotional waves.",
        items: [
          { id: "oce-k1", sense: "taste", prompt: "Faint trace of salt on your lips: 'I am as steadfast as the cliff. The waves of emotion rise and fall, but I remain grounded.'", hint: "Feel your breath align with the ocean tide", iconName: "Smile" },
        ],
      },
    },
  },

  real_world: {
    id: "real_world",
    name: "Your Physical Room Anchor",
    subtitle: "Real-time • 5 Senses in your actual room",
    description: "Scan your immediate physical environment right now. Anchor your mind directly to the objects, textures, and sounds around you.",
    themeGradient: "from-indigo-950 via-slate-950 to-purple-950",
    ambientToneHz: 432, // Healing frequency
    stages: {
      5: {
        stageNumber: 5,
        sense: "see",
        senseLabel: "Sight (Visual Orientation)",
        itemCount: 5,
        instruction: "Look around your actual room right now. Locate 5 specific physical objects.",
        clinicalPurpose: "Grounds attentional focus in your current physical surroundings.",
        items: [
          { id: "rw-s1", sense: "see", prompt: "Look around: Find an object that is blue or cool-colored", hint: "Scan your desk, walls, or clothing", iconName: "Eye" },
          { id: "rw-s2", sense: "see", prompt: "Look around: Find an interesting shadow or natural light beam", hint: "Notice how light lands on surfaces", iconName: "Eye" },
          { id: "rw-s3", sense: "see", prompt: "Look around: Find something with written words or typography", hint: "A book, poster, or screen label", iconName: "Eye" },
          { id: "rw-s4", sense: "see", prompt: "Look around: Find an object made of metal, wood, or glass", hint: "Observe its clean edges and material", iconName: "Eye" },
          { id: "rw-s5", sense: "see", prompt: "Look around: Find something completely small and ordinary", hint: "A pen cap, paperclip, or screw head", iconName: "Eye" },
        ],
      },
      4: {
        stageNumber: 4,
        sense: "touch",
        senseLabel: "Touch (Tactile Grounding)",
        itemCount: 4,
        instruction: "Reach out and physically touch or feel 4 tactile sensations right now.",
        clinicalPurpose: "Tactile confirmation of immediate reality interrupts dissociative loops.",
        items: [
          { id: "rw-t1", sense: "touch", prompt: "Feel your feet pressing firmly against the floor or soles of your shoes", hint: "Press down slightly and feel the resistance", iconName: "Hand" },
          { id: "rw-t2", sense: "touch", prompt: "Touch the fabric of your clothing (cotton, denim, wool)", hint: "Roll the texture between your fingers", iconName: "Hand" },
          { id: "rw-t3", sense: "touch", prompt: "Feel the surface of your desk, table, or chair armrest", hint: "Is it smooth, cool, or textured?", iconName: "Hand" },
          { id: "rw-t4", sense: "touch", prompt: "Notice the temperature of the air entering your nostrils as you breathe", hint: "Cool on the inhale, warm on the exhale", iconName: "Hand" },
        ],
      },
      3: {
        stageNumber: 3,
        sense: "hear",
        senseLabel: "Hearing (Auditory Presence)",
        itemCount: 3,
        instruction: "Close your eyes for a moment and identify 3 subtle sounds in your space.",
        clinicalPurpose: "Expanding auditory awareness grounds the nervous system in physical safety.",
        items: [
          { id: "rw-h1", sense: "hear", prompt: "Listen for the nearest sound (computer fan, breathing, clock)", hint: "The sound closest to your ears", iconName: "Ear" },
          { id: "rw-h2", sense: "hear", prompt: "Listen for a distant sound outside the room (traffic, birds, wind)", hint: "Reach your ears toward the horizon", iconName: "Ear" },
          { id: "rw-h3", sense: "hear", prompt: "Notice the silence underneath the sounds in the room", hint: "The quiet canvas holding everything", iconName: "Ear" },
        ],
      },
      2: {
        stageNumber: 2,
        sense: "smell",
        senseLabel: "Smell (Olfactory Reset)",
        itemCount: 2,
        instruction: "Take two slow breaths through your nose and detect 2 subtle scents.",
        clinicalPurpose: "Engages conscious olfactory discrimination to anchor the prefrontal cortex.",
        items: [
          { id: "rw-m1", sense: "smell", prompt: "Smell your collar, sleeve, or soap on your hands", hint: "Notice the subtle laundry or soap fragrance", iconName: "Wind" },
          { id: "rw-m2", sense: "smell", prompt: "Notice the neutral ambient room scent or fresh air from a window", hint: "Take a deep, slow diaphragmatic inhale", iconName: "Wind" },
        ],
      },
      1: {
        stageNumber: 1,
        sense: "taste",
        senseLabel: "Taste & Center (Somatic Integration)",
        itemCount: 1,
        instruction: "Take a sip of water or repeat your grounding core mantra.",
        clinicalPurpose: "Anchors autonomic regulation in the present physical self.",
        items: [
          { id: "rw-k1", sense: "taste", prompt: "Swallow comfortably: 'I am right here, right now, in this room. The worst has not happened. I am safe.'", hint: "Feel your shoulders drop and jaw unclench", iconName: "Smile" },
        ],
      },
    },
  },
};
