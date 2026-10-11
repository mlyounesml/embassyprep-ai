const QUESTIONS = [
  {
    category: 'Embassy · Motive',
    en: 'Why do you want to join this youth exchange program?',
    ar: 'ليه عايز تشترك في برنامج التبادل؟',
    tip: 'Link English + new friends + future study. 3 short sentences.',
    keywords: ['english', 'learn', 'friends', 'future', 'study'],
    model:
      'I want to join this program to improve my English, make new friends, and learn skills that will help my studies and my future.',
  },
  {
    category: 'Embassy · Home ties',
    en: 'Tell us about your school life in Egypt.',
    ar: 'احكي عن حياتك المدرسية في مصر.',
    tip: 'Name grade, favorite subject, one activity.',
    keywords: ['school', 'grade', 'subject', 'egypt'],
    model:
      'I am in prep school in Egypt. My favorite subject is English because it opens new worlds. After school I play football and volunteer.',
  },
  {
    category: 'Embassy · Future',
    en: 'What do you want to study or become in the future?',
    ar: 'نفسك تدرس إيه أو تبقى إيه؟',
    tip: 'One dream job + how English helps it.',
    keywords: ['future', 'study', 'english', 'want', 'become'],
    model:
      'In the future I want to study technology at university. English will help me read tutorials and work with people from other countries.',
  },
  {
    category: 'Embassy · Culture',
    en: 'If you meet an American student your age, what will you tell him about Egypt?',
    ar: 'لو قابلت طالب أمريكي، هتحكيله إيه عن مصر؟',
    tip: 'History + food + kind people. Show pride.',
    keywords: ['egypt', 'history', 'food', 'people', 'pyramids'],
    model:
      'I would tell him about Egypt’s great history and the pyramids, our tasty food like koshary, and how kind and welcoming Egyptian people are.',
  },
  {
    category: 'Embassy · Adaptation',
    en: 'What would you like to learn about other cultures?',
    ar: 'تحب تعرف إيه عن الثقافات التانية؟',
    tip: 'Their thinking, language, youth interests.',
    keywords: ['learn', 'culture', 'language', 'people'],
    model:
      'I would like to learn how young people in other cultures think, what languages they speak, and how they spend their free time.',
  },
  {
    category: 'Yahya · Volunteering',
    en: 'You volunteer at Resala Charity. What do you do there?',
    ar: 'بتعمل إيه في تطوع رسالة؟',
    tip: 'Use: "I volunteer at Resala to help people in need. I help pack bags and sort clothes."',
    keywords: ['volunteer', 'resala', 'help', 'people', 'teamwork'],
    model:
      'In my free time I volunteer at Resala Charity to help people in need. I help pack charity bags and sort clothes. It teaches me teamwork and responsibility.',
  },
  {
    category: 'Yahya · Teamwork',
    en: 'If a teammate does not participate in a group project, what will you do?',
    ar: 'لو زميلك مش بيشارك في مشروع جماعي هتعمل إيه؟',
    tip: 'Encourage + split the task + succeed together.',
    keywords: ['team', 'help', 'encourage', 'together'],
    model:
      'I will talk to him kindly, find the part he likes, and encourage him. We will split the work and succeed together as a team.',
  },
  {
    category: 'Yahya · Hobbies',
    en: 'What do you do in your free time? Tell us about football, boxing, chess, or gaming.',
    ar: 'بتعمل إيه في وقت فراغك؟',
    tip: 'Pick 1-2 real hobbies + what each teaches you.',
    keywords: ['football', 'boxing', 'chess', 'play', 'teamwork'],
    model:
      'In my free time I love playing football with my friends. It teaches me teamwork and keeps me active. I also enjoy chess because it trains my thinking.',
  },
  {
    category: 'Yahya · Challenge',
    en: 'What is your biggest challenge in English right now?',
    ar: 'إيه أصعب حاجة في الإنجليزي دلوقتي؟',
    tip: 'Honest + positive: "I understand well, but I hesitate when I speak fast."',
    keywords: ['understand', 'speak', 'practice', 'hesitate'],
    model:
      'I understand well when someone speaks, but I sometimes hesitate when I speak fast. I want to practice more and break this fear.',
  },
  {
    category: 'Yahya · AI learning',
    en: 'How do you use AI tools to learn?',
    ar: 'بتستخدم الذكاء الاصطناعي إزاي في التعلم؟',
    tip: 'Tool for ideas and explanations — YOU decide and execute.',
    keywords: ['ai', 'learn', 'ideas', 'help', 'topics'],
    model:
      'I use AI tools to help me learn English, explain difficult topics, and brainstorm new ideas. It helps me learn faster, and I do the work myself.',
  },
];

export default QUESTIONS;
