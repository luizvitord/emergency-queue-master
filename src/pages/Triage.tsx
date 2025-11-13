import { useState } from 'react';
import { usePatients } from '@/contexts/PatientContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PriorityBadge } from '@/components/PriorityBadge';
import { Stethoscope, Phone } from 'lucide-react';
import { PriorityLevel, PRIORITY_CONFIG } from '@/types/patient';
import { useToast } from '@/hooks/use-toast';

export default function Triage() {
  const { getWaitingForTriage, callForTriage, assignPriority } = usePatients();
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [priority, setPriority] = useState<PriorityLevel>('green');
  const [notes, setNotes] = useState('');

  const waitingPatients = getWaitingForTriage();
  const selectedPatient = waitingPatients.find(p => p.id === selectedPatientId);

  const handleCall = (patientId: string) => {
    callForTriage(patientId);
    setSelectedPatientId(patientId);
    toast({
      title: 'Patient Called',
      description: 'Patient has been called to triage',
    });
  };

  const handleConfirmTriage = () => {
    if (selectedPatientId) {
      assignPriority(selectedPatientId, priority, notes);
      toast({
        title: 'Triage Complete',
        description: `Patient classified as ${PRIORITY_CONFIG[priority].label}`,
      });
      setSelectedPatientId(null);
      setPriority('green');
      setNotes('');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Triage Station</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Waiting for Triage</CardTitle>
            <CardDescription>
              {waitingPatients.length} patient{waitingPatients.length !== 1 ? 's' : ''} in queue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {waitingPatients.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No patients waiting for triage</p>
              ) : (
                waitingPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-primary">{patient.ticketNumber}</span>
                        <div>
                          <p className="font-semibold text-foreground">{patient.fullName}</p>
                          <p className="text-sm text-muted-foreground">
                            Age: {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} • 
                            Arrived: {patient.registeredAt.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => handleCall(patient.id)}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call for Triage
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!selectedPatientId} onOpenChange={(open) => !open && setSelectedPatientId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Triage Classification</DialogTitle>
              <DialogDescription>
                Assign Manchester Triage priority for {selectedPatient?.fullName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Priority Level (Manchester Protocol)</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as PriorityLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([level, config]) => (
                      <SelectItem key={level} value={level}>
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={level as PriorityLevel} showLabel={false} />
                          <span>{config.label} ({config.waitTime})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Clinical Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter triage assessment notes..."
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedPatientId(null)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmTriage}>
                Confirm Classification
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
