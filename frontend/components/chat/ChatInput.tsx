"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Send, Smile, Mic, MicOff, X, Search, Plus, Camera, Video, Sparkles, Image as ImageIcon, FileText, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Emoji with Names ──────────────────────────────────────────────────────
interface EmojiItem {
  emoji: string;
  name: string;
}

const EMOJI_CATEGORIES: { label: string; items: EmojiItem[] }[] = [
  {
    label: "😊 Smileys",
    items: [
      { emoji: "😀", name: "Grinning Face" },
      { emoji: "😃", name: "Grinning Face With Big Eyes" },
      { emoji: "😄", name: "Grinning Face With Smiling Eyes" },
      { emoji: "😁", name: "Beaming Face With Smiling Eyes" },
      { emoji: "😆", name: "Grinning Squinting Face" },
      { emoji: "😅", name: "Grinning Face With Sweat" },
      { emoji: "🤣", name: "Rolling on the Floor Laughing" },
      { emoji: "😂", name: "Face With Tears of Joy" },
      { emoji: "🙂", name: "Slightly Smiling Face" },
      { emoji: "🙃", name: "Upside-Down Face" },
      { emoji: "🫠", name: "Melting Face" },
      { emoji: "😉", name: "Winking Face" },
      { emoji: "😊", name: "Smiling Face With Smiling Eyes" },
      { emoji: "😇", name: "Smiling Face With Halo" },
      { emoji: "🥰", name: "Smiling Face With Hearts" },
      { emoji: "😍", name: "Smiling Face With Heart-Eyes" },
      { emoji: "🤩", name: "Star-Struck" },
      { emoji: "😘", name: "Face Blowing a Kiss" },
      { emoji: "😗", name: "Kissing Face" },
      { emoji: "😚", name: "Kissing Face With Closed Eyes" },
      { emoji: "😙", name: "Kissing Face With Smiling Eyes" },
      { emoji: "🥲", name: "Smiling Face With Tear" },
      { emoji: "😋", name: "Face Savoring Food" },
      { emoji: "😛", name: "Face With Tongue" },
      { emoji: "😜", name: "Winking Face With Tongue" },
      { emoji: "🤪", name: "Zany Face" },
      { emoji: "😝", name: "Squinting Face With Tongue" },
      { emoji: "🤑", name: "Money-Mouth Face" },
      { emoji: "🤗", name: "Smiling Face With Open Hands" },
      { emoji: "🤭", name: "Face With Hand Over Mouth" },
      { emoji: "🫢", name: "Face With Open Eyes & Hand Over Mouth" },
      { emoji: "🫣", name: "Face With Peeking Eye" },
      { emoji: "🤫", name: "Shushing Face" },
      { emoji: "🤔", name: "Thinking Face" },
      { emoji: "🫡", name: "Saluting Face" },
      { emoji: "🤐", name: "Zipper-Mouth Face" },
      { emoji: "🤨", name: "Face With Raised Eyebrow" },
      { emoji: "😐", name: "Neutral Face" },
      { emoji: "😑", name: "Expressionless Face" },
      { emoji: "😶", name: "Face Without Mouth" },
      { emoji: "😏", name: "Smirking Face" },
      { emoji: "😒", name: "Unamused Face" },
      { emoji: "🙄", name: "Face With Rolling Eyes" },
      { emoji: "😬", name: "Grimacing Face" },
      { emoji: "🤥", name: "Lying Face" },
      { emoji: "😌", name: "Relieved Face" },
      { emoji: "😔", name: "Pensive Face" },
      { emoji: "😪", name: "Sleepy Face" },
      { emoji: "🤤", name: "Drooling Face" },
      { emoji: "😴", name: "Sleeping Face" },
      { emoji: "😷", name: "Face With Medical Mask" },
      { emoji: "🤒", name: "Face With Thermometer" },
      { emoji: "🤕", name: "Face With Head-Bandage" },
      { emoji: "🤢", name: "Nauseated Face" },
      { emoji: "🤮", name: "Face Vomiting" },
      { emoji: "🤧", name: "Sneezing Face" },
      { emoji: "🥵", name: "Hot Face" },
      { emoji: "🥶", name: "Cold Face" },
      { emoji: "🥴", name: "Woozy Face" },
      { emoji: "😵", name: "Face With Crossed-Out Eyes" },
      { emoji: "💫", name: "Dizzy" },
      { emoji: "🤯", name: "Exploding Head" },
      { emoji: "🤠", name: "Cowboy Hat Face" },
      { emoji: "🥳", name: "Partying Face" },
      { emoji: "🥸", name: "Disguised Face" },
      { emoji: "😎", name: "Smiling Face With Sunglasses" },
      { emoji: "🤓", name: "Nerd Face" },
      { emoji: "🧐", name: "Face With Monocle" },
      { emoji: "😕", name: "Confused Face" },
      { emoji: "🫤", name: "Face With Diagonal Mouth" },
      { emoji: "😟", name: "Worried Face" },
      { emoji: "🙁", name: "Slightly Frowning Face" },
      { emoji: "☹️", name: "Frowning Face" },
      { emoji: "😮", name: "Face With Open Mouth" },
      { emoji: "😯", name: "Hushed Face" },
      { emoji: "😲", name: "Astonished Face" },
      { emoji: "😳", name: "Flushed Face" },
      { emoji: "🥺", name: "Pleading Face" },
      { emoji: "🥹", name: "Face Holding Back Tears" },
      { emoji: "😦", name: "Frowning Face With Open Mouth" },
      { emoji: "😧", name: "Anguished Face" },
      { emoji: "😨", name: "Fearful Face" },
      { emoji: "😰", name: "Anxious Face With Sweat" },
      { emoji: "😥", name: "Sad but Relieved Face" },
      { emoji: "😢", name: "Crying Face" },
      { emoji: "😭", name: "Loudly Crying Face" },
      { emoji: "😱", name: "Face Screaming in Fear" },
      { emoji: "😖", name: "Confounded Face" },
      { emoji: "😣", name: "Persevering Face" },
      { emoji: "😞", name: "Disappointed Face" },
      { emoji: "😓", name: "Downcast Face With Sweat" },
      { emoji: "😩", name: "Weary Face" },
      { emoji: "😫", name: "Tired Face" },
      { emoji: "🥱", name: "Yawning Face" },
      { emoji: "😤", name: "Face With Steam From Nose" },
      { emoji: "😡", name: "Pouting Face" },
      { emoji: "😠", name: "Angry Face" },
      { emoji: "🤬", name: "Face With Symbols on Mouth" },
      { emoji: "😈", name: "Smiling Face With Horns" },
      { emoji: "👿", name: "Angry Face With Horns" },
      { emoji: "💀", name: "Skull" },
      { emoji: "☠️", name: "Skull and Crossbones" },
      { emoji: "💩", name: "Pile of Poo" },
      { emoji: "🤡", name: "Clown Face" },
      { emoji: "👹", name: "Ogre" },
      { emoji: "👺", name: "Goblin" },
      { emoji: "👻", name: "Ghost" },
      { emoji: "👽", name: "Alien" },
      { emoji: "👾", name: "Alien Monster" },
      { emoji: "🤖", name: "Robot" },
    ],
  },
  {
    label: "👋 People",
    items: [
      { emoji: "👋", name: "Waving Hand" },
      { emoji: "🤚", name: "Raised Back of Hand" },
      { emoji: "🖐️", name: "Hand With Fingers Splayed" },
      { emoji: "✋", name: "Raised Hand" },
      { emoji: "🖖", name: "Vulcan Salute" },
      { emoji: "🫱", name: "Rightwards Hand" },
      { emoji: "🫲", name: "Leftwards Hand" },
      { emoji: "🫳", name: "Palm Down Hand" },
      { emoji: "🫴", name: "Palm Up Hand" },
      { emoji: "👌", name: "OK Hand" },
      { emoji: "🤌", name: "Pinched Fingers" },
      { emoji: "🤏", name: "Pinching Hand" },
      { emoji: "✌️", name: "Victory Hand" },
      { emoji: "🤞", name: "Crossed Fingers" },
      { emoji: "🫰", name: "Hand With Index Finger and Thumb Crossed" },
      { emoji: "🤟", name: "Love-You Gesture" },
      { emoji: "🤘", name: "Sign of the Horns" },
      { emoji: "🤙", name: "Call Me Hand" },
      { emoji: "👈", name: "Backhand Index Pointing Left" },
      { emoji: "👉", name: "Backhand Index Pointing Right" },
      { emoji: "👆", name: "Backhand Index Pointing Up" },
      { emoji: "👇", name: "Backhand Index Pointing Down" },
      { emoji: "☝️", name: "Index Pointing Up" },
      { emoji: "🫵", name: "Index Pointing at the Viewer" },
      { emoji: "👍", name: "Thumbs Up" },
      { emoji: "👎", name: "Thumbs Down" },
      { emoji: "✊", name: "Raised Fist" },
      { emoji: "👊", name: "Oncoming Fist" },
      { emoji: "🤛", name: "Left-Facing Fist" },
      { emoji: "🤜", name: "Right-Facing Fist" },
      { emoji: "👏", name: "Clapping Hands" },
      { emoji: "🙌", name: "Raising Hands" },
      { emoji: "🫶", name: "Heart Hands" },
      { emoji: "👐", name: "Open Hands" },
      { emoji: "🤲", name: "Palms Up Together" },
      { emoji: "🤝", name: "Handshake" },
      { emoji: "🙏", name: "Folded Hands / Please / Thank You" },
      { emoji: "✍️", name: "Writing Hand" },
      { emoji: "💅", name: "Nail Polish" },
      { emoji: "🤳", name: "Selfie" },
      { emoji: "💪", name: "Flexed Biceps" },
      { emoji: "🦾", name: "Mechanical Arm" },
      { emoji: "🦿", name: "Mechanical Leg" },
      { emoji: "🦵", name: "Leg" },
      { emoji: "🦶", name: "Foot" },
      { emoji: "👂", name: "Ear" },
      { emoji: "🦻", name: "Ear With Hearing Aid" },
      { emoji: "👃", name: "Nose" },
      { emoji: "🧠", name: "Brain" },
      { emoji: "🦷", name: "Tooth" },
      { emoji: "🦴", name: "Bone" },
      { emoji: "👀", name: "Eyes" },
      { emoji: "👁️", name: "Eye" },
      { emoji: "👅", name: "Tongue" },
      { emoji: "👄", name: "Mouth" },
      { emoji: "🫦", name: "Biting Lip" },
      { emoji: "💋", name: "Kiss Mark" },
      { emoji: "🫂", name: "People Hugging" },
      { emoji: "👶", name: "Baby" },
      { emoji: "🧒", name: "Child" },
      { emoji: "👦", name: "Boy" },
      { emoji: "👧", name: "Girl" },
      { emoji: "🧑", name: "Person" },
      { emoji: "👱", name: "Person: Blond Hair" },
      { emoji: "👩", name: "Woman" },
      { emoji: "🧓", name: "Older Person" },
      { emoji: "👴", name: "Old Man" },
      { emoji: "👵", name: "Old Woman" },
      { emoji: "👮", name: "Police Officer" },
      { emoji: "🕵️", name: "Detective" },
      { emoji: "💂", name: "Guard" },
      { emoji: "🥷", name: "Ninja" },
      { emoji: "👷", name: "Construction Worker" },
      { emoji: "🤴", name: "Prince" },
      { emoji: "👸", name: "Princess" },
      { emoji: "👳", name: "Person Wearing Turban" },
      { emoji: "🧙", name: "Mage / Wizard" },
      { emoji: "🧝", name: "Elf" },
      { emoji: "🧛", name: "Vampire" },
      { emoji: "🧟", name: "Zombie" },
      { emoji: "🧜", name: "Merperson" },
      { emoji: "🧚", name: "Fairy" },
      { emoji: "👼", name: "Baby Angel" },
      { emoji: "🤶", name: "Mrs. Claus" },
      { emoji: "🎅", name: "Santa Claus" },
      { emoji: "🦸", name: "Superhero" },
      { emoji: "🦹", name: "Supervillain" },
      { emoji: "💆", name: "Person Getting Massage" },
      { emoji: "💇", name: "Person Getting Haircut" },
      { emoji: "🚶", name: "Person Walking" },
      { emoji: "🏃", name: "Person Running" },
      { emoji: "💃", name: "Woman Dancing" },
      { emoji: "🕺", name: "Man Dancing" },
      { emoji: "🧘", name: "Person in Lotus Position" },
    ],
  },
  {
    label: "❤️ Hearts",
    items: [
      { emoji: "❤️", name: "Red Heart" },
      { emoji: "🧡", name: "Orange Heart" },
      { emoji: "💛", name: "Yellow Heart" },
      { emoji: "💚", name: "Green Heart" },
      { emoji: "💙", name: "Blue Heart" },
      { emoji: "💜", name: "Purple Heart" },
      { emoji: "🖤", name: "Black Heart" },
      { emoji: "🤍", name: "White Heart" },
      { emoji: "🤎", name: "Brown Heart" },
      { emoji: "❤️‍🔥", name: "Heart on Fire" },
      { emoji: "❤️‍🩹", name: "Mending Heart" },
      { emoji: "💔", name: "Broken Heart" },
      { emoji: "❣️", name: "Heart Exclamation" },
      { emoji: "💕", name: "Two Hearts" },
      { emoji: "💞", name: "Revolving Hearts" },
      { emoji: "💓", name: "Beating Heart" },
      { emoji: "💗", name: "Growing Heart" },
      { emoji: "💖", name: "Sparkling Heart" },
      { emoji: "💘", name: "Heart With Arrow" },
      { emoji: "💝", name: "Heart With Ribbon" },
      { emoji: "💟", name: "Heart Decoration" },
      { emoji: "💌", name: "Love Letter" },
      { emoji: "💍", name: "Ring" },
      { emoji: "💎", name: "Gem Stone" },
      { emoji: "💯", name: "Hundred Points" },
      { emoji: "💢", name: "Anger Symbol" },
      { emoji: "💥", name: "Collision / Boom" },
      { emoji: "💫", name: "Dizzy Star" },
      { emoji: "💦", name: "Sweat Droplets" },
      { emoji: "💨", name: "Dashing Away" },
      { emoji: "💬", name: "Speech Bubble" },
      { emoji: "💭", name: "Thought Balloon" },
      { emoji: "🗯️", name: "Anger Bubble" },
      { emoji: "💤", name: "Zzz / Sleeping" },
      { emoji: "✨", name: "Sparkles" },
      { emoji: "⭐", name: "Star" },
      { emoji: "🌟", name: "Glowing Star" },
      { emoji: "🌙", name: "Crescent Moon" },
      { emoji: "☀️", name: "Sun" },
      { emoji: "🌈", name: "Rainbow" },
      { emoji: "🔥", name: "Fire" },
      { emoji: "💧", name: "Droplet" },
      { emoji: "🌊", name: "Wave" },
      { emoji: "🎵", name: "Musical Note" },
      { emoji: "🎶", name: "Musical Notes" },
    ],
  },
  {
    label: "🐶 Animals",
    items: [
      { emoji: "🐶", name: "Dog Face" },
      { emoji: "🐱", name: "Cat Face" },
      { emoji: "🐭", name: "Mouse Face" },
      { emoji: "🐹", name: "Hamster" },
      { emoji: "🐰", name: "Rabbit Face" },
      { emoji: "🦊", name: "Fox" },
      { emoji: "🐻", name: "Bear" },
      { emoji: "🐼", name: "Panda" },
      { emoji: "🐨", name: "Koala" },
      { emoji: "🐯", name: "Tiger Face" },
      { emoji: "🦁", name: "Lion" },
      { emoji: "🐮", name: "Cow Face" },
      { emoji: "🐷", name: "Pig Face" },
      { emoji: "🐸", name: "Frog" },
      { emoji: "🐵", name: "Monkey Face" },
      { emoji: "🙈", name: "See-No-Evil Monkey" },
      { emoji: "🙉", name: "Hear-No-Evil Monkey" },
      { emoji: "🙊", name: "Speak-No-Evil Monkey" },
      { emoji: "🐔", name: "Chicken" },
      { emoji: "🐧", name: "Penguin" },
      { emoji: "🐦", name: "Bird" },
      { emoji: "🦆", name: "Duck" },
      { emoji: "🦅", name: "Eagle" },
      { emoji: "🦉", name: "Owl" },
      { emoji: "🦇", name: "Bat" },
      { emoji: "🐺", name: "Wolf" },
      { emoji: "🐗", name: "Boar" },
      { emoji: "🐴", name: "Horse Face" },
      { emoji: "🦄", name: "Unicorn" },
      { emoji: "🐝", name: "Honeybee" },
      { emoji: "🦋", name: "Butterfly" },
      { emoji: "🐌", name: "Snail" },
      { emoji: "🐞", name: "Lady Beetle" },
      { emoji: "🐜", name: "Ant" },
      { emoji: "🦟", name: "Mosquito" },
      { emoji: "🦗", name: "Cricket" },
      { emoji: "🦂", name: "Scorpion" },
      { emoji: "🐢", name: "Turtle" },
      { emoji: "🐍", name: "Snake" },
      { emoji: "🦎", name: "Lizard" },
      { emoji: "🦖", name: "T-Rex" },
      { emoji: "🦕", name: "Sauropod (Dinosaur)" },
      { emoji: "🐙", name: "Octopus" },
      { emoji: "🦑", name: "Squid" },
      { emoji: "🦐", name: "Shrimp" },
      { emoji: "🦀", name: "Crab" },
      { emoji: "🐡", name: "Blowfish" },
      { emoji: "🐠", name: "Tropical Fish" },
      { emoji: "🐟", name: "Fish" },
      { emoji: "🐬", name: "Dolphin" },
      { emoji: "🐳", name: "Spouting Whale" },
      { emoji: "🦈", name: "Shark" },
      { emoji: "🐊", name: "Crocodile" },
      { emoji: "🐅", name: "Tiger" },
      { emoji: "🐆", name: "Leopard" },
      { emoji: "🦓", name: "Zebra" },
      { emoji: "🦍", name: "Gorilla" },
      { emoji: "🐘", name: "Elephant" },
      { emoji: "🦛", name: "Hippopotamus" },
      { emoji: "🦏", name: "Rhinoceros" },
      { emoji: "🐪", name: "Camel (One Hump)" },
      { emoji: "🐫", name: "Camel (Two Humps)" },
      { emoji: "🦒", name: "Giraffe" },
      { emoji: "🦘", name: "Kangaroo" },
      { emoji: "🐃", name: "Water Buffalo" },
      { emoji: "🐂", name: "Ox" },
      { emoji: "🐄", name: "Cow" },
      { emoji: "🐎", name: "Horse" },
      { emoji: "🐖", name: "Pig" },
      { emoji: "🐏", name: "Ram" },
      { emoji: "🐑", name: "Ewe / Sheep" },
      { emoji: "🦙", name: "Llama" },
      { emoji: "🐐", name: "Goat" },
      { emoji: "🦌", name: "Deer" },
      { emoji: "🐕", name: "Dog" },
      { emoji: "🐩", name: "Poodle" },
      { emoji: "🦮", name: "Guide Dog" },
      { emoji: "🐈", name: "Cat" },
      { emoji: "🐓", name: "Rooster" },
      { emoji: "🦃", name: "Turkey" },
      { emoji: "🦚", name: "Peacock" },
      { emoji: "🦜", name: "Parrot" },
      { emoji: "🦢", name: "Swan" },
      { emoji: "🦩", name: "Flamingo" },
      { emoji: "🕊️", name: "Dove / Peace" },
      { emoji: "🐇", name: "Rabbit" },
      { emoji: "🦝", name: "Raccoon" },
      { emoji: "🦦", name: "Otter" },
      { emoji: "🦥", name: "Sloth" },
      { emoji: "🐁", name: "Mouse" },
      { emoji: "🐀", name: "Rat" },
      { emoji: "🐿️", name: "Chipmunk" },
      { emoji: "🦔", name: "Hedgehog" },
      { emoji: "🐾", name: "Paw Prints" },
      { emoji: "🐉", name: "Dragon" },
      { emoji: "🐲", name: "Dragon Face" },
    ],
  },
  {
    label: "🍕 Food & Drink",
    items: [
      { emoji: "🍎", name: "Red Apple" },
      { emoji: "🍐", name: "Pear" },
      { emoji: "🍊", name: "Tangerine" },
      { emoji: "🍋", name: "Lemon" },
      { emoji: "🍌", name: "Banana" },
      { emoji: "🍉", name: "Watermelon" },
      { emoji: "🍇", name: "Grapes" },
      { emoji: "🍓", name: "Strawberry" },
      { emoji: "🫐", name: "Blueberries" },
      { emoji: "🍈", name: "Melon" },
      { emoji: "🍒", name: "Cherries" },
      { emoji: "🍑", name: "Peach" },
      { emoji: "🥭", name: "Mango" },
      { emoji: "🍍", name: "Pineapple" },
      { emoji: "🥥", name: "Coconut" },
      { emoji: "🥝", name: "Kiwi Fruit" },
      { emoji: "🍅", name: "Tomato" },
      { emoji: "🫒", name: "Olive" },
      { emoji: "🍆", name: "Eggplant / Aubergine" },
      { emoji: "🥑", name: "Avocado" },
      { emoji: "🥦", name: "Broccoli" },
      { emoji: "🥬", name: "Leafy Green" },
      { emoji: "🥒", name: "Cucumber" },
      { emoji: "🌶️", name: "Hot Pepper" },
      { emoji: "🫑", name: "Bell Pepper" },
      { emoji: "🧄", name: "Garlic" },
      { emoji: "🧅", name: "Onion" },
      { emoji: "🥔", name: "Potato" },
      { emoji: "🍠", name: "Roasted Sweet Potato" },
      { emoji: "🫘", name: "Beans" },
      { emoji: "🌰", name: "Chestnut" },
      { emoji: "🥜", name: "Peanuts" },
      { emoji: "🍞", name: "Bread" },
      { emoji: "🥐", name: "Croissant" },
      { emoji: "🥖", name: "Baguette" },
      { emoji: "🫓", name: "Flatbread" },
      { emoji: "🥨", name: "Pretzel" },
      { emoji: "🥯", name: "Bagel" },
      { emoji: "🧀", name: "Cheese Wedge" },
      { emoji: "🥚", name: "Egg" },
      { emoji: "🍳", name: "Cooking / Fried Egg" },
      { emoji: "🧈", name: "Butter" },
      { emoji: "🥞", name: "Pancakes" },
      { emoji: "🧇", name: "Waffle" },
      { emoji: "🥓", name: "Bacon" },
      { emoji: "🥩", name: "Cut of Meat" },
      { emoji: "🍗", name: "Poultry Leg" },
      { emoji: "🍖", name: "Meat on Bone" },
      { emoji: "🌭", name: "Hot Dog" },
      { emoji: "🍔", name: "Hamburger" },
      { emoji: "🍟", name: "French Fries" },
      { emoji: "🍕", name: "Pizza" },
      { emoji: "🫔", name: "Tamale" },
      { emoji: "🌮", name: "Taco" },
      { emoji: "🌯", name: "Burrito" },
      { emoji: "🥙", name: "Stuffed Flatbread" },
      { emoji: "🧆", name: "Falafel" },
      { emoji: "🍝", name: "Spaghetti" },
      { emoji: "🍜", name: "Steaming Bowl / Ramen" },
      { emoji: "🍲", name: "Pot of Food / Stew" },
      { emoji: "🍛", name: "Curry Rice" },
      { emoji: "🍣", name: "Sushi" },
      { emoji: "🍱", name: "Bento Box" },
      { emoji: "🥟", name: "Dumpling" },
      { emoji: "🍤", name: "Fried Shrimp" },
      { emoji: "🍙", name: "Rice Ball" },
      { emoji: "🍚", name: "Cooked Rice" },
      { emoji: "🍘", name: "Rice Cracker" },
      { emoji: "🍥", name: "Fish Cake With Swirl" },
      { emoji: "🥮", name: "Moon Cake" },
      { emoji: "🍢", name: "Oden" },
      { emoji: "🧁", name: "Cupcake" },
      { emoji: "🍰", name: "Shortcake" },
      { emoji: "🎂", name: "Birthday Cake" },
      { emoji: "🍮", name: "Custard / Pudding" },
      { emoji: "🍭", name: "Lollipop" },
      { emoji: "🍬", name: "Candy" },
      { emoji: "🍫", name: "Chocolate Bar" },
      { emoji: "🍿", name: "Popcorn" },
      { emoji: "🍩", name: "Doughnut" },
      { emoji: "🍪", name: "Cookie" },
      { emoji: "🍯", name: "Honey Pot" },
      { emoji: "🧃", name: "Juice Box" },
      { emoji: "🥤", name: "Cup With Straw" },
      { emoji: "🧋", name: "Bubble Tea" },
      { emoji: "☕", name: "Hot Beverage / Coffee" },
      { emoji: "🫖", name: "Teapot" },
      { emoji: "🍵", name: "Teacup Without Handle / Green Tea" },
      { emoji: "🍺", name: "Beer Mug" },
      { emoji: "🍻", name: "Clinking Beer Mugs" },
      { emoji: "🥂", name: "Clinking Glasses" },
      { emoji: "🍷", name: "Wine Glass" },
      { emoji: "🍸", name: "Cocktail Glass" },
      { emoji: "🍹", name: "Tropical Drink" },
      { emoji: "🧊", name: "Ice Cube" },
      { emoji: "🥃", name: "Tumbler Glass / Whiskey" },
      { emoji: "🍾", name: "Bottle With Popping Cork / Champagne" },
      { emoji: "🧂", name: "Salt" },
      { emoji: "🫙", name: "Jar" },
    ],
  },
  {
    label: "⚽ Activities",
    items: [
      { emoji: "⚽", name: "Soccer Ball" },
      { emoji: "🏀", name: "Basketball" },
      { emoji: "🏈", name: "American Football" },
      { emoji: "⚾", name: "Baseball" },
      { emoji: "🥎", name: "Softball" },
      { emoji: "🎾", name: "Tennis" },
      { emoji: "🏐", name: "Volleyball" },
      { emoji: "🏉", name: "Rugby Football" },
      { emoji: "🥏", name: "Flying Disc / Frisbee" },
      { emoji: "🎱", name: "Billiards / Pool Ball" },
      { emoji: "🏓", name: "Ping Pong" },
      { emoji: "🏸", name: "Badminton" },
      { emoji: "🏒", name: "Ice Hockey" },
      { emoji: "🏑", name: "Field Hockey" },
      { emoji: "🥍", name: "Lacrosse" },
      { emoji: "🏏", name: "Cricket Game" },
      { emoji: "⛳", name: "Flag in Hole / Golf" },
      { emoji: "🎣", name: "Fishing Pole" },
      { emoji: "🤿", name: "Diving Mask" },
      { emoji: "🎽", name: "Running Shirt" },
      { emoji: "🎿", name: "Skis" },
      { emoji: "🛷", name: "Sled" },
      { emoji: "🥌", name: "Curling Stone" },
      { emoji: "🎯", name: "Direct Hit / Bullseye" },
      { emoji: "🎳", name: "Bowling" },
      { emoji: "🏋️", name: "Person Lifting Weights" },
      { emoji: "🤸", name: "Person Cartwheeling" },
      { emoji: "⛷️", name: "Skier" },
      { emoji: "🏂", name: "Snowboarder" },
      { emoji: "🪂", name: "Parachute / Skydiving" },
      { emoji: "🏊", name: "Person Swimming" },
      { emoji: "🚣", name: "Person Rowing Boat" },
      { emoji: "🧗", name: "Person Climbing" },
      { emoji: "🚵", name: "Person Mountain Biking" },
      { emoji: "🚴", name: "Person Biking" },
      { emoji: "🏆", name: "Trophy" },
      { emoji: "🥇", name: "1st Place Medal" },
      { emoji: "🥈", name: "2nd Place Medal" },
      { emoji: "🥉", name: "3rd Place Medal" },
      { emoji: "🏅", name: "Sports Medal" },
      { emoji: "🎖️", name: "Military Medal" },
      { emoji: "🎪", name: "Circus Tent" },
      { emoji: "🤹", name: "Person Juggling" },
      { emoji: "🎭", name: "Performing Arts / Theater" },
      { emoji: "🩰", name: "Ballet Shoes" },
      { emoji: "🎨", name: "Artist Palette" },
      { emoji: "🎬", name: "Clapper Board / Film" },
      { emoji: "🎤", name: "Microphone" },
      { emoji: "🎧", name: "Headphone" },
      { emoji: "🎼", name: "Musical Score" },
      { emoji: "🎹", name: "Musical Keyboard / Piano" },
      { emoji: "🥁", name: "Drum" },
      { emoji: "🎷", name: "Saxophone" },
      { emoji: "🎺", name: "Trumpet" },
      { emoji: "🎸", name: "Guitar" },
      { emoji: "🪕", name: "Banjo" },
      { emoji: "🎻", name: "Violin" },
      { emoji: "🎲", name: "Game Die / Dice" },
      { emoji: "♟️", name: "Chess Pawn" },
      { emoji: "🎮", name: "Video Game / Controller" },
      { emoji: "🕹️", name: "Joystick" },
      { emoji: "🎰", name: "Slot Machine" },
      { emoji: "🧩", name: "Puzzle Piece" },
      { emoji: "🪆", name: "Nesting Dolls" },
      { emoji: "🪅", name: "Piñata" },
      { emoji: "🎉", name: "Party Popper / Celebration" },
      { emoji: "🎊", name: "Confetti Ball" },
      { emoji: "🎁", name: "Wrapped Gift" },
      { emoji: "🎀", name: "Ribbon" },
      { emoji: "🎆", name: "Fireworks" },
      { emoji: "🎇", name: "Sparkler" },
      { emoji: "🧨", name: "Firecracker" },
    ],
  },
  {
    label: "🚗 Travel",
    items: [
      { emoji: "🚗", name: "Automobile / Car" },
      { emoji: "🚕", name: "Taxi" },
      { emoji: "🚙", name: "Sport Utility Vehicle" },
      { emoji: "🚌", name: "Bus" },
      { emoji: "🚎", name: "Trolleybus" },
      { emoji: "🏎️", name: "Racing Car" },
      { emoji: "🚓", name: "Police Car" },
      { emoji: "🚑", name: "Ambulance" },
      { emoji: "🚒", name: "Fire Engine" },
      { emoji: "🚐", name: "Minibus" },
      { emoji: "🛻", name: "Pickup Truck" },
      { emoji: "🚚", name: "Delivery Truck" },
      { emoji: "🚛", name: "Articulated Lorry" },
      { emoji: "🚜", name: "Tractor" },
      { emoji: "🏍️", name: "Motorcycle" },
      { emoji: "🛵", name: "Motor Scooter" },
      { emoji: "🚲", name: "Bicycle" },
      { emoji: "🛴", name: "Kick Scooter" },
      { emoji: "🛹", name: "Skateboard" },
      { emoji: "🛼", name: "Roller Skate" },
      { emoji: "🚏", name: "Bus Stop" },
      { emoji: "⛽", name: "Fuel Pump / Gas Station" },
      { emoji: "🚨", name: "Police Car Light / Siren" },
      { emoji: "🚦", name: "Vertical Traffic Light" },
      { emoji: "🚧", name: "Construction Sign" },
      { emoji: "⚓", name: "Anchor" },
      { emoji: "🛟", name: "Ring Buoy / Life Preserver" },
      { emoji: "⛵", name: "Sailboat" },
      { emoji: "🚤", name: "Speedboat" },
      { emoji: "🛥️", name: "Motor Boat" },
      { emoji: "🛳️", name: "Passenger Ship" },
      { emoji: "🚢", name: "Ship" },
      { emoji: "✈️", name: "Airplane" },
      { emoji: "🛩️", name: "Small Airplane" },
      { emoji: "🚁", name: "Helicopter" },
      { emoji: "🚀", name: "Rocket" },
      { emoji: "🛸", name: "Flying Saucer / UFO" },
      { emoji: "🛎️", name: "Bellhop Bell / Hotel" },
      { emoji: "🧳", name: "Luggage" },
      { emoji: "🌍", name: "Globe Showing Europe-Africa" },
      { emoji: "🌎", name: "Globe Showing Americas" },
      { emoji: "🌏", name: "Globe Showing Asia-Australia" },
      { emoji: "🗺️", name: "World Map" },
      { emoji: "🧭", name: "Compass" },
      { emoji: "🏔️", name: "Snow-Capped Mountain" },
      { emoji: "⛰️", name: "Mountain" },
      { emoji: "🌋", name: "Volcano" },
      { emoji: "🗻", name: "Mount Fuji" },
      { emoji: "🏕️", name: "Camping" },
      { emoji: "🏖️", name: "Beach With Umbrella" },
      { emoji: "🏜️", name: "Desert" },
      { emoji: "🏝️", name: "Desert Island" },
      { emoji: "🏞️", name: "National Park" },
      { emoji: "🏟️", name: "Stadium" },
      { emoji: "🏛️", name: "Classical Building" },
      { emoji: "🏗️", name: "Building Construction" },
      { emoji: "🏠", name: "House" },
      { emoji: "🏡", name: "House With Garden" },
      { emoji: "🏢", name: "Office Building" },
      { emoji: "🏥", name: "Hospital" },
      { emoji: "🏦", name: "Bank" },
      { emoji: "🏨", name: "Hotel" },
      { emoji: "🏪", name: "Convenience Store" },
      { emoji: "🏫", name: "School" },
      { emoji: "🏰", name: "European Castle" },
      { emoji: "🏯", name: "Japanese Castle" },
      { emoji: "💒", name: "Wedding / Chapel" },
      { emoji: "🗼", name: "Tokyo Tower" },
      { emoji: "🗽", name: "Statue of Liberty" },
      { emoji: "⛪", name: "Church" },
      { emoji: "🕌", name: "Mosque" },
      { emoji: "🕍", name: "Synagogue" },
      { emoji: "⛩️", name: "Shinto Shrine" },
      { emoji: "🕋", name: "Kaaba" },
      { emoji: "⛲", name: "Fountain" },
      { emoji: "⛺", name: "Tent" },
    ],
  },
  {
    label: "💡 Objects",
    items: [
      { emoji: "📱", name: "Mobile Phone" },
      { emoji: "💻", name: "Laptop Computer" },
      { emoji: "⌨️", name: "Keyboard" },
      { emoji: "🖥️", name: "Desktop Computer" },
      { emoji: "🖨️", name: "Printer" },
      { emoji: "🖱️", name: "Computer Mouse" },
      { emoji: "💽", name: "Computer Disk" },
      { emoji: "💾", name: "Floppy Disk" },
      { emoji: "💿", name: "Optical Disk / CD" },
      { emoji: "📀", name: "DVD" },
      { emoji: "🧮", name: "Abacus" },
      { emoji: "📞", name: "Telephone Receiver" },
      { emoji: "☎️", name: "Telephone" },
      { emoji: "📺", name: "Television" },
      { emoji: "📻", name: "Radio" },
      { emoji: "📡", name: "Satellite Antenna" },
      { emoji: "🔋", name: "Battery" },
      { emoji: "🔌", name: "Electric Plug" },
      { emoji: "💡", name: "Light Bulb / Idea" },
      { emoji: "🔦", name: "Flashlight / Torch" },
      { emoji: "🕯️", name: "Candle" },
      { emoji: "🪔", name: "Diya Lamp" },
      { emoji: "🧯", name: "Fire Extinguisher" },
      { emoji: "💸", name: "Money With Wings" },
      { emoji: "💵", name: "Dollar Banknote" },
      { emoji: "💰", name: "Money Bag" },
      { emoji: "💳", name: "Credit Card" },
      { emoji: "💎", name: "Gem Stone / Diamond" },
      { emoji: "⚖️", name: "Balance Scale / Justice" },
      { emoji: "🦯", name: "White Cane" },
      { emoji: "🔧", name: "Wrench" },
      { emoji: "🔨", name: "Hammer" },
      { emoji: "⚒️", name: "Hammer and Pick" },
      { emoji: "🛠️", name: "Hammer and Wrench" },
      { emoji: "⛏️", name: "Pick / Pickaxe" },
      { emoji: "🔩", name: "Nut and Bolt" },
      { emoji: "🪛", name: "Screwdriver" },
      { emoji: "🔗", name: "Link / Chain" },
      { emoji: "🪝", name: "Hook" },
      { emoji: "🧲", name: "Magnet" },
      { emoji: "🪜", name: "Ladder" },
      { emoji: "🧰", name: "Toolbox" },
      { emoji: "🔑", name: "Key" },
      { emoji: "🗝️", name: "Old Key" },
      { emoji: "🔒", name: "Locked" },
      { emoji: "🔓", name: "Unlocked" },
      { emoji: "🚪", name: "Door" },
      { emoji: "🪞", name: "Mirror" },
      { emoji: "🪟", name: "Window" },
      { emoji: "🛏️", name: "Bed" },
      { emoji: "🛋️", name: "Couch and Lamp" },
      { emoji: "🪑", name: "Chair" },
      { emoji: "🚽", name: "Toilet" },
      { emoji: "🚿", name: "Shower" },
      { emoji: "🛁", name: "Bathtub" },
      { emoji: "🧴", name: "Lotion Bottle" },
      { emoji: "🧷", name: "Safety Pin" },
      { emoji: "🧹", name: "Broom" },
      { emoji: "🧺", name: "Basket" },
      { emoji: "🧻", name: "Roll of Paper" },
      { emoji: "🪣", name: "Bucket" },
      { emoji: "🧼", name: "Soap" },
      { emoji: "🪥", name: "Toothbrush" },
      { emoji: "🧽", name: "Sponge" },
      { emoji: "🪒", name: "Razor" },
      { emoji: "🔭", name: "Telescope" },
      { emoji: "🔬", name: "Microscope" },
      { emoji: "🩺", name: "Stethoscope" },
      { emoji: "🩻", name: "X-Ray" },
      { emoji: "🩹", name: "Adhesive Bandage / Band-Aid" },
      { emoji: "💊", name: "Pill / Medicine" },
      { emoji: "💉", name: "Syringe / Injection" },
      { emoji: "🩸", name: "Drop of Blood" },
      { emoji: "🧬", name: "DNA" },
      { emoji: "🦠", name: "Microbe / Virus" },
      { emoji: "🧪", name: "Test Tube" },
      { emoji: "🧫", name: "Petri Dish" },
      { emoji: "📚", name: "Books" },
      { emoji: "📖", name: "Open Book" },
      { emoji: "📝", name: "Memo / Note" },
      { emoji: "✏️", name: "Pencil" },
      { emoji: "🖊️", name: "Pen" },
      { emoji: "📌", name: "Pushpin" },
      { emoji: "📎", name: "Paperclip" },
      { emoji: "✂️", name: "Scissors" },
      { emoji: "🗑️", name: "Wastebasket / Trash" },
      { emoji: "📦", name: "Package / Box" },
      { emoji: "📫", name: "Closed Mailbox With Raised Flag" },
      { emoji: "📧", name: "E-Mail" },
      { emoji: "📅", name: "Calendar" },
      { emoji: "📊", name: "Bar Chart" },
      { emoji: "📈", name: "Chart Increasing" },
      { emoji: "📉", name: "Chart Decreasing" },
    ],
  },
  {
    label: "🌈 Nature",
    items: [
      { emoji: "🌸", name: "Cherry Blossom" },
      { emoji: "🌹", name: "Rose" },
      { emoji: "🥀", name: "Wilted Flower" },
      { emoji: "🌺", name: "Hibiscus" },
      { emoji: "🌻", name: "Sunflower" },
      { emoji: "🌼", name: "Blossom" },
      { emoji: "🌷", name: "Tulip" },
      { emoji: "🪷", name: "Lotus" },
      { emoji: "💐", name: "Bouquet" },
      { emoji: "🌱", name: "Seedling" },
      { emoji: "🌿", name: "Herb / Leaves" },
      { emoji: "☘️", name: "Shamrock" },
      { emoji: "🍀", name: "Four Leaf Clover" },
      { emoji: "🌾", name: "Sheaf of Rice" },
      { emoji: "🍃", name: "Leaf Fluttering in Wind" },
      { emoji: "🍂", name: "Fallen Leaf" },
      { emoji: "🍁", name: "Maple Leaf" },
      { emoji: "🌵", name: "Cactus" },
      { emoji: "🎄", name: "Christmas Tree" },
      { emoji: "🌲", name: "Evergreen Tree" },
      { emoji: "🌳", name: "Deciduous Tree" },
      { emoji: "🌴", name: "Palm Tree" },
      { emoji: "🪵", name: "Wood / Log" },
      { emoji: "🌾", name: "Wheat / Grain" },
      { emoji: "🍄", name: "Mushroom" },
      { emoji: "🐚", name: "Spiral Shell" },
      { emoji: "🪸", name: "Coral" },
      { emoji: "🌑", name: "New Moon" },
      { emoji: "🌒", name: "Waxing Crescent Moon" },
      { emoji: "🌓", name: "First Quarter Moon" },
      { emoji: "🌔", name: "Waxing Gibbous Moon" },
      { emoji: "🌕", name: "Full Moon" },
      { emoji: "🌖", name: "Waning Gibbous Moon" },
      { emoji: "🌗", name: "Last Quarter Moon" },
      { emoji: "🌘", name: "Waning Crescent Moon" },
      { emoji: "🌙", name: "Crescent Moon" },
      { emoji: "🌚", name: "New Moon Face" },
      { emoji: "🌛", name: "First Quarter Moon Face" },
      { emoji: "🌜", name: "Last Quarter Moon Face" },
      { emoji: "🌝", name: "Full Moon Face" },
      { emoji: "🌞", name: "Sun With Face" },
      { emoji: "🪐", name: "Ringed Planet / Saturn" },
      { emoji: "⭐", name: "Star" },
      { emoji: "🌟", name: "Glowing Star" },
      { emoji: "💫", name: "Dizzy / Shooting Star" },
      { emoji: "✨", name: "Sparkles" },
      { emoji: "☄️", name: "Comet" },
      { emoji: "☀️", name: "Sun" },
      { emoji: "🌤️", name: "Sun Behind Small Cloud" },
      { emoji: "⛅", name: "Sun Behind Cloud" },
      { emoji: "🌥️", name: "Sun Behind Large Cloud" },
      { emoji: "☁️", name: "Cloud" },
      { emoji: "🌦️", name: "Sun Behind Rain Cloud" },
      { emoji: "🌧️", name: "Cloud With Rain" },
      { emoji: "⛈️", name: "Cloud With Lightning and Rain" },
      { emoji: "🌩️", name: "Cloud With Lightning" },
      { emoji: "🌨️", name: "Cloud With Snow" },
      { emoji: "❄️", name: "Snowflake" },
      { emoji: "☃️", name: "Snowman" },
      { emoji: "⛄", name: "Snowman Without Snow" },
      { emoji: "🌬️", name: "Wind Face" },
      { emoji: "💨", name: "Dashing Away / Wind" },
      { emoji: "🌀", name: "Cyclone / Tornado" },
      { emoji: "🌈", name: "Rainbow" },
      { emoji: "☔", name: "Umbrella With Rain Drops" },
      { emoji: "⚡", name: "High Voltage / Lightning" },
      { emoji: "🔥", name: "Fire / Flame" },
      { emoji: "💧", name: "Droplet / Water Drop" },
      { emoji: "🌊", name: "Water Wave / Ocean" },
      { emoji: "🌫️", name: "Fog" },
      { emoji: "🌌", name: "Milky Way / Galaxy" },
      { emoji: "🌅", name: "Sunrise" },
      { emoji: "🌄", name: "Sunrise Over Mountains" },
      { emoji: "🌠", name: "Shooting Star" },
      { emoji: "🌃", name: "Night With Stars" },
      { emoji: "🌉", name: "Bridge at Night" },
    ],
  },
  {
    label: "🔣 Symbols",
    items: [
      { emoji: "✅", name: "Check Mark Button" },
      { emoji: "❌", name: "Cross Mark" },
      { emoji: "❎", name: "Cross Mark Button" },
      { emoji: "✔️", name: "Heavy Check Mark" },
      { emoji: "❓", name: "Question Mark" },
      { emoji: "❗", name: "Exclamation Mark" },
      { emoji: "❕", name: "White Exclamation Mark" },
      { emoji: "❔", name: "White Question Mark" },
      { emoji: "💯", name: "Hundred Points / 100" },
      { emoji: "🔴", name: "Red Circle" },
      { emoji: "🟠", name: "Orange Circle" },
      { emoji: "🟡", name: "Yellow Circle" },
      { emoji: "🟢", name: "Green Circle" },
      { emoji: "🔵", name: "Blue Circle" },
      { emoji: "🟣", name: "Purple Circle" },
      { emoji: "⚫", name: "Black Circle" },
      { emoji: "⚪", name: "White Circle" },
      { emoji: "🟤", name: "Brown Circle" },
      { emoji: "🔺", name: "Red Triangle Pointing Up" },
      { emoji: "🔻", name: "Red Triangle Pointing Down" },
      { emoji: "🔷", name: "Large Blue Diamond" },
      { emoji: "🔶", name: "Large Orange Diamond" },
      { emoji: "🔹", name: "Small Blue Diamond" },
      { emoji: "🔸", name: "Small Orange Diamond" },
      { emoji: "⬛", name: "Black Large Square" },
      { emoji: "⬜", name: "White Large Square" },
      { emoji: "🟥", name: "Red Square" },
      { emoji: "🟧", name: "Orange Square" },
      { emoji: "🟨", name: "Yellow Square" },
      { emoji: "🟩", name: "Green Square" },
      { emoji: "🟦", name: "Blue Square" },
      { emoji: "🟪", name: "Purple Square" },
      { emoji: "🟫", name: "Brown Square" },
      { emoji: "🚫", name: "Prohibited / No Entry" },
      { emoji: "⛔", name: "No Entry" },
      { emoji: "📵", name: "No Mobile Phones" },
      { emoji: "🔕", name: "Bell With Slash / Muted" },
      { emoji: "🔔", name: "Bell / Notification" },
      { emoji: "🔛", name: "ON Arrow" },
      { emoji: "🔝", name: "TOP Arrow" },
      { emoji: "🔙", name: "BACK Arrow" },
      { emoji: "🔚", name: "END Arrow" },
      { emoji: "🆗", name: "OK Button" },
      { emoji: "🆕", name: "NEW Button" },
      { emoji: "🆙", name: "UP Button" },
      { emoji: "🆓", name: "FREE Button" },
      { emoji: "🆒", name: "COOL Button" },
      { emoji: "🆖", name: "NG Button" },
      { emoji: "🆘", name: "SOS Button / Emergency" },
      { emoji: "♻️", name: "Recycling Symbol" },
      { emoji: "☮️", name: "Peace Symbol" },
      { emoji: "✝️", name: "Latin Cross" },
      { emoji: "☪️", name: "Star and Crescent" },
      { emoji: "🕉️", name: "Om Symbol" },
      { emoji: "☸️", name: "Wheel of Dharma" },
      { emoji: "✡️", name: "Star of David" },
      { emoji: "☯️", name: "Yin Yang" },
      { emoji: "🛐", name: "Place of Worship" },
      { emoji: "⚜️", name: "Fleur-de-Lis" },
      { emoji: "🔱", name: "Trident Emblem" },
      { emoji: "📛", name: "Name Badge" },
      { emoji: "🔰", name: "Japanese Symbol for Beginner" },
      { emoji: "💲", name: "Heavy Dollar Sign" },
      { emoji: "™️", name: "Trade Mark" },
      { emoji: "©️", name: "Copyright" },
      { emoji: "®️", name: "Registered" },
      { emoji: "〰️", name: "Wavy Dash" },
      { emoji: "➕", name: "Plus Sign" },
      { emoji: "➖", name: "Minus Sign" },
      { emoji: "➗", name: "Division Sign" },
      { emoji: "✖️", name: "Multiplication Sign" },
      { emoji: "♾️", name: "Infinity" },
      { emoji: "🔅", name: "Dim Button" },
      { emoji: "🔆", name: "Bright Button" },
    ],
  },
];

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function ChatInput({
  onSend,
  disabled,
  onWebcamClick,
  onFileUploadClick,
  onSampleFaceClick,
  onVoiceRecordClick,
  imagePreview,
  attachedFileName,
  audioUrl,
  isRecording,
  onRemoveImage,
  onRemoveFile,
  onRemoveAudio,
  onStopRecording,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
  onWebcamClick?: () => void;
  onFileUploadClick?: () => void;
  onSampleFaceClick?: () => void;
  onVoiceRecordClick?: () => void;
  imagePreview?: string | null;
  attachedFileName?: string | null;
  audioUrl?: string | null;
  isRecording?: boolean;
  onRemoveImage?: () => void;
  onRemoveFile?: () => void;
  onRemoveAudio?: () => void;
  onStopRecording?: () => void;
}) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [tooltip, setTooltip] = useState<{ name: string; emoji: string } | null>(null);

  const recognitionRef = useRef<any>(null);
  const emojiPanelRef = useRef<HTMLDivElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setShowPlusMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Flatten all items for search
  const allItems = EMOJI_CATEGORIES.flatMap((c) => c.items);
  const filteredItems = searchQuery
    ? allItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.emoji.includes(searchQuery)
      )
    : EMOJI_CATEGORIES[activeCategory].items;

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      setVoiceSupported(true);
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript;
          else interim += event.results[i][0].transcript;
        }
        if (final) { setText((p) => (p ? p + " " + final : final)); setInterimText(""); }
        else setInterimText(interim);
      };
      recognitionRef.current.onend = () => { setIsListening(false); setInterimText(""); };
      recognitionRef.current.onerror = () => { setIsListening(false); setInterimText(""); };
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiPanelRef.current && !emojiPanelRef.current.contains(e.target as Node)) {
        setShowEmoji(false); setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (showEmoji) setTimeout(() => searchRef.current?.focus(), 100);
  }, [showEmoji]);

  const adjustHeight = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      const nextHeight = Math.min(inputRef.current.scrollHeight, 240); // ~10 lines max height
      inputRef.current.style.height = `${nextHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [text, adjustHeight]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const final = text.trim();
    if (!final || disabled) return;
    onSend(final);
    setText("");
    setInterimText("");
    setShowEmoji(false);
    setShowPlusMenu(false);
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const handleEmojiClick = (emoji: string) => {
    setText((p) => p + emoji);
    inputRef.current?.focus();
  };

  const toggleVoice = useCallback(() => {
    if (!voiceSupported || !recognitionRef.current) return;
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { try { recognitionRef.current.start(); setIsListening(true); } catch { setIsListening(false); } }
  }, [isListening, voiceSupported]);

  return (
    <div className="relative">
      {/* ── Emoji Picker ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            ref={emojiPanelRef}
            className="absolute bottom-full mb-2 left-0 w-96 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
              <span className="text-xs font-bold text-slate-300">Emoji Picker</span>
              <button onClick={() => { setShowEmoji(false); setSearchQuery(""); }} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-3 pt-2 pb-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name (e.g. 'heart', 'smile', 'fire')..."
                  className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
                />
              </div>
            </div>

            {/* Category Tabs */}
            {!searchQuery && (
              <div className="flex border-b border-white/5 overflow-x-auto px-1 pt-1 scrollbar-none">
                {EMOJI_CATEGORIES.map((cat, i) => (
                  <button
                    key={cat.label}
                    onClick={() => setActiveCategory(i)}
                    className={`flex-shrink-0 px-2 py-1.5 text-[10px] font-semibold rounded-t-lg transition-all whitespace-nowrap ${
                      activeCategory === i
                        ? "text-violet-400 bg-violet-500/10 border-b-2 border-violet-500"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            {/* Tooltip bar */}
            <div className="h-6 px-4 flex items-center">
              {tooltip ? (
                <span className="text-[11px] text-violet-300 font-semibold">
                  {tooltip.emoji} {tooltip.name}
                </span>
              ) : (
                <span className="text-[11px] text-slate-600">Hover an emoji to see its name</span>
              )}
            </div>

            {/* Emoji Grid */}
            <div className="p-2 h-48 overflow-y-auto">
              {filteredItems.length === 0 ? (
                <p className="text-center text-slate-500 text-xs mt-10">
                  No emojis found for &quot;{searchQuery}&quot;
                </p>
              ) : (
                <div className="grid grid-cols-10 gap-0.5">
                  {filteredItems.map((item, idx) => (
                    <button
                      key={`${item.emoji}-${idx}`}
                      onClick={() => handleEmojiClick(item.emoji)}
                      onMouseEnter={() => setTooltip(item)}
                      onMouseLeave={() => setTooltip(null)}
                      className="text-xl p-1 rounded-lg hover:bg-white/10 transition-all hover:scale-125 active:scale-95"
                      aria-label={item.name}
                    >
                      {item.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/5 text-[10px] text-slate-600">
              {searchQuery
                ? `${filteredItems.length} result${filteredItems.length !== 1 ? "s" : ""} for "${searchQuery}"`
                : `${EMOJI_CATEGORIES[activeCategory].items.length} emojis in this category • ${allItems.length} total`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/40 rounded-2xl px-4 py-2 flex items-center gap-3 z-30 whitespace-nowrap shadow-lg"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
          >
            <div className="flex gap-1 items-end">
              {[0, 1, 2, 3].map((i) => (
                <motion.div key={i} className="w-1 bg-red-400 rounded-full"
                  animate={{ height: ["6px", "14px", "6px"] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                />
              ))}
            </div>
            <span className="text-xs text-red-300 font-semibold">
              {interimText ? `"${interimText}"` : "Listening... speak now"}
            </span>
            <button onClick={toggleVoice} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plus Action Options Popover */}
      <AnimatePresence>
        {showPlusMenu && (
          <motion.div
            ref={plusMenuRef}
            className="absolute bottom-full mb-3 left-4 bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-2xl z-50 w-72 backdrop-blur-xl space-y-1.5"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
          >
            <div className="text-[10px] font-extrabold text-purple-400 uppercase px-2 py-1 tracking-wider flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
              <Sparkles className="w-3.5 h-3.5" /> MindCare Quick Actions
            </div>

            {/* Section 1: Multimodal Attachments */}
            <div className="pt-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase px-2 tracking-wider block mb-1">
                Attach Media & Documents
              </span>

              {onFileUploadClick && (
                <button
                  type="button"
                  onClick={() => { setShowPlusMenu(false); onFileUploadClick(); }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-left group"
                >
                  <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-white">Upload File</span>
                    <span className="block text-[10px] text-slate-500">PDF, Word, spreadsheet, code, or photo</span>
                  </div>
                </button>
              )}

              {onWebcamClick && (
                <button
                  type="button"
                  onClick={() => { setShowPlusMenu(false); onWebcamClick(); }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-left group"
                >
                  <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-white">Camera Snapshot</span>
                    <span className="block text-[10px] text-slate-500">Capture face for real-time emotion reading</span>
                  </div>
                </button>
              )}

              {onVoiceRecordClick && (
                <button
                  type="button"
                  onClick={() => { setShowPlusMenu(false); onVoiceRecordClick(); }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-left group"
                >
                  <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-white">Voice Note</span>
                    <span className="block text-[10px] text-slate-500">Record acoustic voice check-in</span>
                  </div>
                </button>
              )}
            </div>

            {/* Section 2: Emotion AI Dedicated Suites */}
            <div className="pt-1.5 border-t border-slate-800/80">
              <span className="text-[9px] font-bold text-purple-400 uppercase px-2 tracking-wider block mb-1">
                Emotion AI Suites
              </span>

              {/* Facial Emotion AI */}
              <Link
                href="/facial-emotion"
                onClick={() => setShowPlusMenu(false)}
                className="w-full flex items-center gap-2.5 p-2 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-left group"
              >
                <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-bold text-white">Facial Emotion</span>
                  <span className="block text-[10px] text-slate-500">Real-time facial micro-expression detector</span>
                </div>
              </Link>

              {/* Video Emotion AI */}
              <Link
                href="/video-emotion"
                onClick={() => setShowPlusMenu(false)}
                className="w-full flex items-center gap-2.5 p-2 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-left group"
              >
                <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-bold text-white">Video Emotion</span>
                  <span className="block text-[10px] text-slate-500">Per-sentence & holistic video analysis</span>
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-2.5 md:p-3 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-2xl backdrop-blur-2xl focus-within:border-purple-500/60 focus-within:shadow-[0_0_30px_rgba(168,85,247,0.18)] transition-all">
        {/* Embedded Multimodal Attachment Chips (Inside Searchbar) */}
        {(imagePreview || audioUrl || isRecording || attachedFileName) && (
          <div className="flex items-center gap-2 px-2 pt-1 pb-2 border-b border-slate-800/80 flex-wrap">
            {attachedFileName && (
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-2xl border border-blue-500/30 shadow-sm animate-fade-in">
                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-bold text-blue-200 truncate max-w-[200px]">{attachedFileName}</span>
                {onRemoveFile && (
                  <button type="button" onClick={onRemoveFile} className="text-slate-400 hover:text-white text-xs font-bold ml-1 p-0.5 rounded hover:bg-white/10 transition-colors">
                    &times;
                  </button>
                )}
              </div>
            )}

            {imagePreview && !attachedFileName && (
              <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-2xl border border-purple-500/30 shadow-sm animate-fade-in">
                <img src={imagePreview} className="w-8 h-7 rounded-lg object-cover border border-purple-500/40" alt="Facial snapshot" />
                <span className="text-xs font-bold text-purple-300">Facial Snapshot Attached</span>
                {onRemoveImage && (
                  <button type="button" onClick={onRemoveImage} className="text-slate-400 hover:text-white text-xs font-bold ml-1 p-0.5 rounded hover:bg-white/10 transition-colors">
                    &times;
                  </button>
                )}
              </div>
            )}

            {audioUrl && (
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-2xl border border-rose-500/30 shadow-sm animate-fade-in">
                <audio src={audioUrl} controls className="h-6 w-36" />
                <span className="text-xs font-bold text-rose-300">Voice Note</span>
                {onRemoveAudio && (
                  <button type="button" onClick={onRemoveAudio} className="text-slate-400 hover:text-white text-xs font-bold ml-1 p-0.5 rounded hover:bg-white/10 transition-colors">
                    &times;
                  </button>
                )}
              </div>
            )}

            {isRecording && (
              <div className="flex items-center gap-2 text-rose-300 text-xs font-bold animate-pulse bg-rose-500/15 px-3 py-1.5 rounded-2xl border border-rose-500/30 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-rose-500 block animate-ping" />
                <span>Recording voice note...</span>
                {onStopRecording && (
                  <button type="button" onClick={onStopRecording} className="ml-1 text-xs text-rose-200 hover:text-white font-extrabold underline transition-colors">
                    Done
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 items-center w-full">
          {/* Plus Action Button (Left) */}
          <button
            type="button"
            onClick={() => { setShowPlusMenu((p) => !p); setShowEmoji(false); }}
            className={`p-2.5 rounded-full border transition-all flex-shrink-0 ${
              showPlusMenu
                ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/30 rotate-45 scale-105"
                : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
            aria-label="Toggle Attachments & Options"
            title="Add attachments & quick tools"
          >
            <Plus className="w-5 h-5 transition-transform duration-200" />
          </button>

          <textarea
            ref={inputRef}
            rows={1}
            value={isListening && interimText ? text + interimText : text}
            onChange={(e) => {
              setText(e.target.value);
              adjustHeight();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
            placeholder={isListening ? "Listening... speak now" : "Message MindCare AI, ask a question, or share how you feel..."}
            disabled={disabled}
            className={`flex-1 bg-white/5 border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 disabled:opacity-50 text-white placeholder-slate-500 transition-all resize-none overflow-y-auto max-h-[220px] min-h-[44px] scrollbar-thin scrollbar-thumb-slate-800 ${
              isListening ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20 bg-red-500/5" : "border-white/10 focus:border-purple-500/80 focus:ring-purple-500/30"
            }`}
          />

          {/* Emoji Picker Button */}
          <button
            type="button"
            onClick={() => { setShowEmoji((p) => !p); setShowPlusMenu(false); setSearchQuery(""); }}
            className={`p-2.5 rounded-full border transition-all flex-shrink-0 ${
              showEmoji ? "bg-purple-500/25 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
            aria-label="Toggle Emoji Picker"
            title="Emoji expressions"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Voice Input Button */}
          {voiceSupported ? (
            <button
              type="button" onClick={toggleVoice}
              className={`p-2.5 rounded-full border transition-all flex-shrink-0 ${
                isListening ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
              aria-label={isListening ? "Stop Voice Input" : "Start Voice Input"}
              title={isListening ? "Click to stop listening" : "Voice dictation"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          ) : (
            <button type="button" disabled className="p-2.5 rounded-full bg-white/5 border border-white/10 text-slate-600 cursor-not-allowed flex-shrink-0" title="Voice input not supported">
              <Mic className="w-5 h-5" />
            </button>
          )}

          {/* Dynamic Send Button */}
          <button
            type="submit"
            disabled={(!text.trim() && !imagePreview && !audioUrl && !attachedFileName) || disabled}
            className={`p-2.5 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 ${
              (!text.trim() && !imagePreview && !audioUrl && !attachedFileName) || disabled
                ? "bg-slate-800 border border-slate-700/50 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-purple-600/30 hover:scale-105 active:scale-95"
            }`}
            aria-label="Send Message"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
