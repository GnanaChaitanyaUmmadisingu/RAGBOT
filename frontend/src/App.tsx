import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Fade,
  useTheme,
  createTheme,
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  InputAdornment,
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Psychology as ThinkingIcon,
  Face as HumanIcon,
} from '@mui/icons-material';

type Msg = { role: 'user'|'bot'; text: string; timestamp?: Date; isTyping?: boolean; greeting?: boolean };

// Create AI-themed dark theme with gradients
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4285f4', // Google Blue
      light: '#669df6',
      dark: '#1565c0',
    },
    secondary: {
      main: '#34a853', // Google Green
    },
    background: {
      default: '#0f0f0f',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
    },
  },
  typography: {
    fontFamily: '"Google Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

// Thinking animation component
const ThinkingAnimation = () => {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box display="flex" alignItems="center" gap={1} sx={{ color: 'text.secondary' }}>
      <ThinkingIcon sx={{ fontSize: 20, animation: 'pulse 1.5s ease-in-out infinite' }} />
      <Typography variant="body2">Aria is thinking{dots}</Typography>
    </Box>
  );
};

// Typing effect component
const TypingEffect = ({ text, onComplete }: { text: string; onComplete: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 30); // Typing speed: 30ms per character
      return () => clearTimeout(timeout);
    } else {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  return (
    <Typography variant="body1" sx={{ 
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      lineHeight: 1.6
    }}>
      {displayedText}
      <span style={{ 
        animation: 'blink 1s infinite',
        marginLeft: '2px'
      }}>|</span>
    </Typography>
  );
};

// Greeting messages based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning!";
  if (hour < 17) return "Good afternoon!";
  return "Good evening!";
};

export default function App() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [tenantId, setTenantId] = useState('adhub');
  const [hasGreeted, setHasGreeted] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, busy]);

  // Send greeting on first interaction
  const sendGreeting = () => {
    if (!hasGreeted && messages.length === 0) {
      const greeting = `${getGreeting()} I'm Aria, your AI assistant for Adhub. I'm here to help you with campaigns, ads, billing, optimization, and any questions you might have. What would you like to know?`;
      const greetingMessage: Msg = { role: 'bot', text: greeting, timestamp: new Date() };
      setMessages([greetingMessage]);
      setHasGreeted(true);
    }
  };

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    
    // Send greeting if this is the first message
    if (!hasGreeted) {
      sendGreeting();
    }
    
    const userMessage: Msg = { role: 'user', text, timestamp: new Date() };
    setMessages(m => [...m, userMessage]);
    setInput('');
    setBusy(true);
    
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, user: { tenant_id: tenantId } })
      });
      const data = await resp.json();
      
      // Add bot message with typing effect
      const botMessage: Msg = { 
        role: 'bot', 
        text: data.answer, 
        timestamp: new Date(),
        isTyping: true,
        greeting: data.greeting || false
      };
      const newMessages = [...messages, userMessage, botMessage];
      setMessages(newMessages);
      setTypingMessageId(newMessages.length - 1);
      
    } catch (e: any) {
      const errorMessage: Msg = { 
        role: 'bot', 
        text: 'Sorry, I encountered an error. Please try again.', 
        timestamp: new Date(),
        isTyping: true,
        greeting: false
      };
      const newMessages = [...messages, userMessage, errorMessage];
      setMessages(newMessages);
      setTypingMessageId(newMessages.length - 1);
    } finally {
      setBusy(false);
    }
  }

  const handleTypingComplete = (messageIndex: number) => {
    setMessages(m => m.map((msg, i) => 
      i === messageIndex ? { ...msg, isTyping: false } : msg
    ));
    setTypingMessageId(null);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)'
      }}>
        {/* Header with Gradient */}
        <AppBar 
          position="static" 
          elevation={0} 
          sx={{ 
            background: 'linear-gradient(90deg,rgb(0, 170, 255) 0%, #34a853 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <Toolbar>
            <Avatar 
              sx={{ 
                mr: 2,
                background: 'linear-gradient(45deg, #ff6b6b 0%, #4ecdc4 100%)',
                width: 40,
                height: 40
              }}
            >
              <HumanIcon sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 500, color: 'white' }}>
                Aria
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Adhub AI Assistant
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Chip 
              label={`Tenant: ${tenantId}`} 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            />
          </Toolbar>
        </AppBar>

        {/* Chat Area */}
        <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Container maxWidth="md" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', py: 2 }}>
            <Paper 
              elevation={0} 
              sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column',
                background: 'linear-gradient(145deg, rgba(26,26,26,0.9) 0%, rgba(22,33,62,0.9) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                overflow: 'hidden'
              }}
            >
              {/* Messages */}
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {messages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', mt: 8 }}>
                    <Avatar 
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        mx: 'auto', 
                        mb: 3,
                        background: 'linear-gradient(45deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                      }}
                    >
                      <HumanIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Typography variant="h4" gutterBottom sx={{ 
                      fontWeight: 500,
                      background: 'linear-gradient(45deg, #4285f4 0%, #34a853 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 2
                    }}>
                      Hi! I'm Aria
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '1.1rem' }}>
                      Your AI assistant for Adhub. Ask me anything about campaigns, ads, billing, or optimization.
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                      {[
                        "How do I create a campaign?",
                        "What are the ad requirements?",
                        "How do I optimize my ads?",
                        "What's the minimum budget?"
                      ].map((suggestion) => (
                        <Chip
                          key={suggestion}
                          label={suggestion}
                          variant="outlined"
                          onClick={() => setInput(suggestion)}
                          sx={{ 
                            cursor: 'pointer',
                            border: '1px solid rgba(66,133,244,0.3)',
                            color: '#4285f4',
                            '&:hover': { 
                              bgcolor: 'rgba(66,133,244,0.1)',
                              border: '1px solid rgba(66,133,244,0.5)'
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <List sx={{ 
                    p: 0,
                    maxHeight: '100%',
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'linear-gradient(45deg, rgba(66,133,244,0.6) 0%, rgba(52,168,83,0.6) 100%)',
                      borderRadius: '4px',
                      '&:hover': {
                        background: 'linear-gradient(45deg, rgba(66,133,244,0.8) 0%, rgba(52,168,83,0.8) 100%)',
                      }
                    },
                    '&::-webkit-scrollbar-corner': {
                      background: 'transparent',
                    }
                  }}>
                    {messages.map((msg, i) => (
                      <ListItem key={i} sx={{ alignItems: 'flex-start', py: 2 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            width: 36,
                            height: 36,
                            background: msg.role === 'user' 
                              ? 'linear-gradient(45deg, #34a853 0%, #45b7d1 100%)'
                              : 'linear-gradient(45deg, #ff6b6b 0%, #4ecdc4 100%)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                          }}>
                            {msg.role === 'user' ? <PersonIcon /> : <HumanIcon />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            msg.role === 'bot' && msg.isTyping ? (
                              <TypingEffect 
                                text={msg.text} 
                                onComplete={() => handleTypingComplete(i)} 
                              />
                            ) : (
                              <Typography variant="body1" sx={{ 
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                lineHeight: 1.6,
                                ...(msg.greeting && {
                                  background: 'linear-gradient(45deg, rgba(66,133,244,0.1) 0%, rgba(52,168,83,0.1) 100%)',
                                  padding: '12px 16px',
                                  borderRadius: '12px',
                                  border: '1px solid rgba(66,133,244,0.2)',
                                  margin: '4px 0'
                                })
                              }}>
                                {msg.text}
                              </Typography>
                            )
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                              {msg.role === 'user' ? 'You' : 'Aria'} • {msg.timestamp?.toLocaleTimeString()}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                    {busy && (
                      <ListItem sx={{ alignItems: 'flex-start', py: 2 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            width: 36,
                            height: 36,
                            background: 'linear-gradient(45deg, #ff6b6b 0%, #4ecdc4 100%)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                          }}>
                            <HumanIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<ThinkingAnimation />}
                        />
                      </ListItem>
                    )}
                    <div ref={messagesEndRef} />
                  </List>
                )}
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

              {/* Input Area */}
              <Box sx={{ p: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Aria anything about Adhub..."
                  disabled={busy}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={send}
                          disabled={!input.trim() || busy}
                          sx={{ 
                            background: 'linear-gradient(45deg,rgb(244, 140, 66) 0%, #34a853 100%)',
                            color: 'white',
                            boxShadow: '0 4px 16px rgba(66,133,244,0.3)',
                            '&:hover': { 
                              background: 'linear-gradient(45deg,rgb(192, 49, 21) 0%, #2e7d32 100%)',
                              boxShadow: '0 6px 20px rgba(66,133,244,0.4)'
                            },
                            '&:disabled': { 
                              background: 'rgba(255,255,255,0.1)',
                              boxShadow: 'none'
                            }
                          }}
                        >
                          {busy ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(66,133,244,0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4285f4',
                        borderWidth: '2px',
                      },
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Answers are grounded in Adhub documentation only
                </Typography>
              </Box>
            </Paper>
          </Container>
        </Box>
      </Box>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
    </ThemeProvider>
  );
}
