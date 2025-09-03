// Greeting detection and response system

export type GreetingType = 'hello' | 'goodbye' | 'thanks' | 'help' | 'none';

// Greeting patterns
const greetingPatterns = {
  hello: [
    'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
    'greetings', 'howdy', 'what\'s up', 'sup', 'yo', 'hiya', 'heya',
    'good day', 'morning', 'afternoon', 'evening', 'greet'
  ],
  goodbye: [
    'bye', 'goodbye', 'see you', 'farewell', 'take care', 'catch you later',
    'later', 'cya', 'ttyl', 'talk to you later', 'have a good day',
    'have a good night', 'good night', 'night', 'adios', 'cheers'
  ],
  thanks: [
    'thank you', 'thanks', 'thx', 'appreciate', 'grateful', 'much appreciated',
    'thank you so much', 'thanks a lot', 'ty', 'tysm'
  ],
  help: [
    'help', 'can you help', 'what can you do', 'what do you do', 'assist',
    'support', 'guide', 'how can you help', 'what are your capabilities'
  ]
};

// Get greeting type from message
export function detectGreeting(message: string): GreetingType {
  const normalized = message.toLowerCase().trim();
  
  for (const [type, patterns] of Object.entries(greetingPatterns)) {
    for (const pattern of patterns) {
      // Check for exact match or word boundary match
      const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (normalized === pattern || regex.test(normalized)) {
        return type as GreetingType;
      }
    }
  }
  
  return 'none';
}

// Generate greeting responses
export function getGreetingResponse(type: GreetingType, userName?: string): string {
  const name = userName ? `, ${userName}` : '';
  
  switch (type) {
    case 'hello':
      const hour = new Date().getHours();
      let timeGreeting = 'Hello';
      if (hour < 12) timeGreeting = 'Good morning';
      else if (hour < 17) timeGreeting = 'Good afternoon';
      else timeGreeting = 'Good evening';
      
      return `${timeGreeting}${name}! I'm Aria, your AI assistant for Adhub. I'm here to help you with campaigns, ads, billing, optimization, and any questions you might have. What would you like to know?`;
    
    case 'goodbye':
      return `Goodbye${name}! It was great helping you today. Feel free to come back anytime if you have more questions about Adhub. Have a wonderful day! 👋`;
    
    case 'thanks':
      return `You're very welcome${name}! I'm happy I could help. Is there anything else about Adhub you'd like to know?`;
    
    case 'help':
      return `I'd be happy to help${name}! I'm Aria, your AI assistant for Adhub. I can help you with:

🎯 **Campaign Management**: Creating, optimizing, and managing campaigns
💰 **Budget & Billing**: Budget requirements, allocation, and payment options  
🎨 **Ad Requirements**: Image/video specs, content policies, and creative guidelines
📊 **Reporting & Analytics**: Metrics, insights, and performance tracking
🔐 **Account Access**: Login, authentication, and account management
🎯 **Audience Targeting**: Demographics, interests, and custom audiences
⚡ **Optimization**: Best practices and performance improvements

What specific area would you like help with?`;
    
    default:
      return '';
  }
}

// Check if message is primarily a greeting
export function isGreeting(message: string): boolean {
  const normalized = message.toLowerCase().trim();
  const words = normalized.split(' ');
  
  // If message is very short and contains greeting words
  if (words.length <= 3) {
    const greetingType = detectGreeting(message);
    return greetingType !== 'none';
  }
  
  // If message starts with greeting
  const firstWords = words.slice(0, 2).join(' ');
  const greetingType = detectGreeting(firstWords);
  return greetingType !== 'none';
}
