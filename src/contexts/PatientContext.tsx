import React, { createContext, useContext, useState, useCallback } from 'react';
import { Patient, PriorityLevel, TriageCall } from '@/types/patient';

interface PatientContextType {
  patients: Patient[];
  recentCalls: TriageCall[];
  registerPatient: (data: { fullName: string; dateOfBirth: string; cpf: string }) => Patient;
  callForTriage: (patientId: string) => void;
  assignPriority: (patientId: string, priority: PriorityLevel, notes: string) => void;
  callForDoctor: (patientId: string, room: string) => void;
  completeConsultation: (patientId: string) => void;
  getWaitingForTriage: () => Patient[];
  getWaitingForDoctor: () => Patient[];
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

let ticketCounter = 0;

export const PatientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [recentCalls, setRecentCalls] = useState<TriageCall[]>([]);

  const generateTicketNumber = useCallback(() => {
    ticketCounter += 1;
    return `SENHA-${String(ticketCounter).padStart(3, '0')}`;
  }, []);

  const registerPatient = useCallback((data: { fullName: string; dateOfBirth: string; cpf: string }) => {
    const newPatient: Patient = {
      id: crypto.randomUUID(),
      ticketNumber: generateTicketNumber(),
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      cpf: data.cpf,
      registeredAt: new Date(),
      status: 'waiting-triage',
    };
    
    setPatients(prev => [...prev, newPatient]);
    return newPatient;
  }, [generateTicketNumber]);

  const callForTriage = useCallback((patientId: string) => {
    setPatients(prev => prev.map(p => 
      p.id === patientId ? { ...p, status: 'in-triage' as const } : p
    ));
    
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      const call: TriageCall = {
        ticketNumber: patient.ticketNumber,
        type: 'triage',
        timestamp: new Date(),
      };
      setRecentCalls(prev => [call, ...prev].slice(0, 4));
    }
  }, [patients]);

  const assignPriority = useCallback((patientId: string, priority: PriorityLevel, notes: string) => {
    setPatients(prev => prev.map(p => 
      p.id === patientId 
        ? { ...p, status: 'waiting-doctor' as const, priority, triageNotes: notes } 
        : p
    ));
  }, []);

  const callForDoctor = useCallback((patientId: string, room: string) => {
    setPatients(prev => prev.map(p => 
      p.id === patientId 
        ? { ...p, status: 'in-consultation' as const, assignedRoom: room } 
        : p
    ));
    
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      const call: TriageCall = {
        ticketNumber: patient.ticketNumber,
        type: 'doctor',
        room,
        priority: patient.priority,
        timestamp: new Date(),
      };
      setRecentCalls(prev => [call, ...prev].slice(0, 4));
    }
  }, [patients]);

  const completeConsultation = useCallback((patientId: string) => {
    setPatients(prev => prev.map(p => 
      p.id === patientId ? { ...p, status: 'completed' as const } : p
    ));
  }, []);

  const getWaitingForTriage = useCallback(() => {
    return patients
      .filter(p => p.status === 'waiting-triage')
      .sort((a, b) => a.registeredAt.getTime() - b.registeredAt.getTime());
  }, [patients]);

  const getWaitingForDoctor = useCallback(() => {
    const priorityOrder = { red: 1, orange: 2, yellow: 3, green: 4, blue: 5 };
    return patients
      .filter(p => p.status === 'waiting-doctor')
      .sort((a, b) => {
        if (!a.priority || !b.priority) return 0;
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.registeredAt.getTime() - b.registeredAt.getTime();
      });
  }, [patients]);

  return (
    <PatientContext.Provider
      value={{
        patients,
        recentCalls,
        registerPatient,
        callForTriage,
        assignPriority,
        callForDoctor,
        completeConsultation,
        getWaitingForTriage,
        getWaitingForDoctor,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatients = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatients must be used within PatientProvider');
  }
  return context;
};
