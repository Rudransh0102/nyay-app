import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../../theme';
import apiClient from '../../../api/client';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

const DEFAULT_SUGGESTIONS = [
  "Explain Article 21 of Constitution",
  "How to file an FIR?",
  "What are bail conditions?",
  "Draft a legal notice",
];

interface Props {
  onBack?: () => void;
  suggestions?: string[];
}

export function AskAIScreen({ onBack, suggestions = DEFAULT_SUGGESTIONS }: Props) {
  const { colors, spacing, borderRadius, typography, shadow } = useTheme();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      text: trimmedInput,
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      // TODO: Implement actual API call to backend AI endpoint
      // const response = await apiClient.post('/api/ai/ask', { query: trimmedInput });
      // const aiResponse = response.data.answer;

      // Mock response for now
      const aiResponse = "This endpoint is not yet implemented. Please try again later.";

      const aiMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        text: aiResponse,
        isUser: false,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
      setError(errorMessage);
      console.error('AI query failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInput(suggestion);
  };

  const clearConversation = () => {
    setMessages([]);
    setInput('');
    setError(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.lg, borderBottomColor: colors.glassBorder }]}>
          <TouchableOpacity onPress={onBack} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text, fontSize: typography.fontSize.lg }]}>
            Nyay AI Assistant
          </Text>
          <TouchableOpacity
            onPress={clearConversation}
            disabled={messages.length === 0}
            accessibilityLabel="Clear conversation"
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={messages.length === 0 ? colors.textTertiary : colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.chatContainer, { paddingHorizontal: spacing.lg }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.aiIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="sparkles" size={40} color={colors.primary} />
              </View>
              <Text style={[styles.welcomeText, { color: colors.text }]}>
                How can I help you with Indian Law today?
              </Text>

              <View style={styles.suggestions}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleSuggestionPress(s)}
                    style={[
                      styles.suggestionBtn,
                      { backgroundColor: colors.surface, borderColor: colors.glassBorder },
                    ]}
                    accessibilityLabel={`Suggest: ${s}`}
                  >
                    <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                      {s}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <>
              {messages.map((msg) => (
                <Animated.View
                  key={msg.id}
                  entering={FadeIn}
                  style={[
                    styles.messageBubble,
                    msg.isUser
                      ? styles.userBubble
                      : [styles.aiBubble, { backgroundColor: colors.surface }],
                  ]}
                >
                  {!msg.isUser && (
                    <View style={[styles.miniAiIcon, { backgroundColor: colors.primary }]}>
                      <Ionicons name="sparkles" size={12} color="white" />
                    </View>
                  )}
                  <Text style={[styles.messageText, { color: msg.isUser ? 'white' : colors.text }]}>
                    {msg.text}
                  </Text>
                </Animated.View>
              ))}
              {isLoading && (
                <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: colors.surface }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.messageText, { color: colors.textSecondary, marginLeft: 8 }]}>
                    Thinking...
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Error Message */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputWrapper, { padding: spacing.lg, backgroundColor: colors.background }]}>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.surface, borderColor: colors.glassBorder, ...shadow.sm },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Ask anything about Indian law..."
              placeholderTextColor={colors.textTertiary}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={isLoading || !input.trim()}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: isLoading || !input.trim() ? colors.textTertiary : colors.primary,
                },
              ]}
              accessibilityLabel="Send message"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    borderBottomWidth: 1,
  },
  title: { fontWeight: '700', flex: 1, textAlign: 'center' },
  chatContainer: { paddingVertical: 20 },
  emptyState: { alignItems: 'center', marginTop: 40, flex: 1 },
  aiIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  suggestions: { width: '100%', gap: 12, paddingHorizontal: 16 },
  suggestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionText: { fontSize: 14, fontWeight: '500', flex: 1 },
  messageBubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF6B35',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  miniAiIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  messageText: { fontSize: 15, lineHeight: 22, flex: 1 },
  inputWrapper: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 50,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendBtn: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: { fontSize: 14, fontWeight: '500', flex: 1 },
});
