"use client";

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateFollowUpQuestions } from '@/lib/ai';
import { FollowUpQuestion } from '@/types/questions';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { QuestionSection } from './components/question-section';
import { VoiceInput } from './components/voice-input';

interface FollowUpQuestionsForm {
  [key: string]: string;
}

interface FollowUpQuestionsProps {
  initialData: any;
  onSubmit: (data: FollowUpQuestionsForm) => void;
}

export function FollowUpQuestions({ initialData, onSubmit }: FollowUpQuestionsProps) {
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { register, handleSubmit, setValue, watch } = useForm<FollowUpQuestionsForm>();
  const { toast } = useToast();
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript && activeField) {
      setValue(activeField, transcript);
    }
  }, [transcript, activeField, setValue]);

  const fetchQuestions = async () => {
    let isMounted = true;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const questions = await generateFollowUpQuestions(initialData);
      if (!isMounted) return;
      
      setFollowUpQuestions(questions);
      setRetryCount(0);
    } catch (error) {
      if (!isMounted) return;

      const message = error instanceof Error 
        ? error.message 
        : 'We encountered a problem analyzing your responses.';
      
      setError(message);
      toast({
        title: "Unable to generate follow-up questions",
        description: "You can try again or proceed to the next step.",
        variant: "destructive"
      });
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    fetchQuestions();
  }, [initialData, toast]);

  const handleVoiceInput = (field: string) => {
    if (listening && activeField === field) {
      SpeechRecognition.stopListening();
      resetTranscript();
      setActiveField(null);
    } else {
      setActiveField(field);
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  const getReasonIcon = (reason: FollowUpQuestion['reason']) => {
    switch (reason) {
      case 'insufficient':
        return '📝';
      case 'clarification':
        return '🔍';
      case 'support':
        return '💪';
      default:
        return '❓';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">
          Analyzing your responses...
        </p>
      </div>
    );
  }

  if (error || followUpQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-accent-light/50 rounded-xl p-6 max-w-xl text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-medium mb-2">
            {error ? 'Unable to generate follow-up questions' : 'No additional questions needed'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {error
              ? "We're having trouble connecting to our AI service. You can try again or proceed with generating your letter."
              : "We have enough information to proceed with your letter."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {error && retryCount < 3 && (
              <Button
                onClick={fetchQuestions}
                variant="outline"
                className="pill"
              >
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Try again
              </Button>
            )}
            <Button
              onClick={() => onSubmit({})}
              className="pill bg-primary text-white hover:opacity-90"
            >
              Continue to letter generation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {followUpQuestions.map((question, index) => (
        <QuestionSection
          key={question.id}
          title={`Additional Information ${index + 1}`}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-start gap-3 mb-2">
              <span className="text-xl" role="img" aria-label="question type">
                {getReasonIcon(question.reason)}
              </span>
              <div>
                <Label htmlFor={question.id} className="text-lg font-medium">
                  {question.question}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {question.context}
                </p>
              </div>
            </div>
            
            <div className="relative">
              <Textarea
                id={question.id}
                {...register(question.id)}
                className="bg-white focus:ring-accent focus:border-accent pr-12"
                rows={4}
              />
              {browserSupportsSpeechRecognition && (
                <VoiceInput
                  isListening={listening && activeField === question.id}
                  onToggle={() => handleVoiceInput(question.id)}
                  className="absolute right-2 top-2 h-8 w-8 hover:bg-accent-light/50"
                />
              )}
            </div>
            {listening && activeField === question.id && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {transcript || 'Listening to your voice input...'}
              </p>
            )}
          </motion.div>
        </QuestionSection>
      ))}

      <div className="flex justify-end">
        <Button 
          type="submit" 
          className="pill bg-primary text-white hover:opacity-90"
        >
          Continue
        </Button>
      </div>
    </form>
  );
}