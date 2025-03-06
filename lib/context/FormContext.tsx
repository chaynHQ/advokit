"use client";

import { clientConfig } from '@/lib/rollbar';
import { FollowUpQuestion } from '@/types/questions';
import { createContext, ReactNode, useContext, useState } from 'react';
import Rollbar from 'rollbar';

// Initialize Rollbar for client-side
const rollbar = new Rollbar(clientConfig);

// Define types for our form data
interface PlatformInfo {
  platformId: string;
  platformName: string;
  isCustom: boolean;
  customName?: string;
}

interface ReportingInfo {
  status: 'standard-completed' | 'escalated-completed' | 'both-completed' | 'none-completed' | null;
}

interface InitialQuestionsData {
  imageIdentification: string;
  contentType: 'intimate' | 'personal' | 'private' | 'other';
  contentContext: 'hacked' | 'impersonation' | 'relationship' | 'unknown' | 'other';
  imageUploadDate: string;
  imageTakenDate: string;
  ownershipEvidence: string;
  impactStatement: string;
}

interface ReportingDetailsData {
  standardProcessDetails?: string;
  escalatedProcessDetails?: string;
  responseReceived?: string;
  additionalStepsTaken?: string;
}

interface FollowUpData {
  questions: FollowUpQuestion[];
  answers: Record<string, string>;
}

interface FormState {
  platformInfo: PlatformInfo | null;
  reportingInfo: ReportingInfo | null;
  initialQuestions: Partial<InitialQuestionsData>;
  reportingDetails: Partial<ReportingDetailsData>;
  followUpData: FollowUpData;
  completeFormData: any;
}

interface FormContextType {
  formState: FormState;
  setPlatformInfo: (info: PlatformInfo) => void;
  setReportingInfo: (info: ReportingInfo) => void;
  setInitialQuestions: (data: Partial<InitialQuestionsData>) => void;
  setReportingDetails: (data: Partial<ReportingDetailsData>) => void;
  setFollowUpData: (questions: FollowUpQuestion[], answers: Record<string, string>) => void;
  updateCompleteFormData: () => void;
  resetForm: () => void;
}

const initialState: FormState = {
  platformInfo: null,
  reportingInfo: null,
  initialQuestions: {},
  reportingDetails: {},
  followUpData: {
    questions: [],
    answers: {}
  },
  completeFormData: null
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: ReactNode }) {
  const [formState, setFormState] = useState<FormState>(initialState);

  const setPlatformInfo = (info: PlatformInfo) => {
    try {
      setFormState(prev => ({
        ...prev,
        platformInfo: info,
      }));
      rollbar.info('Platform info set', { platformInfo: info });
    } catch (error) {
      rollbar.error('Error setting platform info', { error, info });
    }
  };

  const setReportingInfo = (info: ReportingInfo) => {
    try {
      setFormState(prev => ({
        ...prev,
        reportingInfo: info,
      }));
      rollbar.info('Reporting info set', { reportingInfo: info });
    } catch (error) {
      rollbar.error('Error setting reporting info', { error, info });
    }
  };

  const setInitialQuestions = (data: Partial<InitialQuestionsData>) => {
    try {
      setFormState(prev => ({
        ...prev,
        initialQuestions: {
          ...prev.initialQuestions,
          ...data,
        },
      }));
      rollbar.info('Initial questions set', { 
        contentType: data.contentType,
        contentContext: data.contentContext 
      });
    } catch (error) {
      rollbar.error('Error setting initial questions', { error });
    }
  };

  const setReportingDetails = (data: Partial<ReportingDetailsData>) => {
    try {
      setFormState(prev => ({
        ...prev,
        reportingDetails: {
          ...prev.reportingDetails,
          ...data,
        },
      }));
      rollbar.info('Reporting details set');
    } catch (error) {
      rollbar.error('Error setting reporting details', { error });
    }
  };

  const setFollowUpData = (questions: FollowUpQuestion[], answers: Record<string, string>) => {
    try {
      setFormState(prev => ({
        ...prev,
        followUpData: {
          questions,
          answers
        },
      }));
      rollbar.info('Follow-up data set', { 
        questionCount: questions.length,
        answerCount: Object.keys(answers).length 
      });
    } catch (error) {
      rollbar.error('Error setting follow-up data', { error });
    }
  };

  const updateCompleteFormData = () => {
    try {
      setFormState(prev => {
        const completeData = {
          initialQuestions: prev.initialQuestions,
          platformInfo: {
            name: prev.platformInfo?.isCustom 
              ? prev.platformInfo.customName 
              : prev.platformInfo?.platformName,
            isCustom: prev.platformInfo?.isCustom || false
          },
          reportingDetails: Object.keys(prev.reportingDetails).length > 0 
            ? prev.reportingDetails 
            : undefined,
          followUp: prev.followUpData.answers
        };
        
        rollbar.info('Complete form data updated');
        
        return {
          ...prev,
          completeFormData: completeData
        };
      });
    } catch (error) {
      rollbar.error('Error updating complete form data', { error });
    }
  };

  const resetForm = () => {
    try {
      setFormState(initialState);
      rollbar.info('Form state reset');
    } catch (error) {
      rollbar.error('Error resetting form state', { error });
    }
  };

  return (
    <FormContext.Provider
      value={{
        formState,
        setPlatformInfo,
        setReportingInfo,
        setInitialQuestions,
        setReportingDetails,
        setFollowUpData,
        updateCompleteFormData,
        resetForm,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

export function useFormContext() {
  const context = useContext(FormContext);
  if (context === undefined) {
    rollbar.error('useFormContext used outside of FormProvider');
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
}