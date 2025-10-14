'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Target, Palette } from 'lucide-react';
import { AnalysisPersona } from '@/lib/constants/analysisPersonas';

interface AnalysisPersonaSelectorProps {
  selectedPersona: AnalysisPersona;
  onSelectPersona: (persona: AnalysisPersona) => void;
  personas: AnalysisPersona[];
}

export function AnalysisPersonaSelector({
  selectedPersona,
  onSelectPersona,
  personas}: AnalysisPersonaSelectorProps) {
  return (
    <Card className="border-border bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Analysis Expert
        </CardTitle>
        <CardDescription className="text-sm">
          Choose an expert persona to analyze your prompt from their professional perspective
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={selectedPersona.id}
          onValueChange={(value) => {
            const persona = personas.find((p) => p.id === value);
            if (persona) onSelectPersona(persona);
          }}
        >
          <SelectTrigger className="bg-background border-border focus:border-ring">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedPersona.icon}</span>
                <span className="font-medium">{selectedPersona.name}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {personas.map((persona) => (
              <SelectItem key={persona.id} value={persona.id}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{persona.icon}</span>
                  <div>
                    <div className="font-medium">{persona.name}</div>
                    <div className="text-xs text-muted-foreground">{persona.description}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-3 h-3 text-primary" />
              <span className="text-sm font-medium text-foreground">Specialization</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedPersona.specialization.map((spec, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs bg-primary/10 text-primary border-primary/20"
                >
                  {spec}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-3 h-3 text-primary" />
              <span className="text-sm font-medium text-foreground">Analysis Focus</span>
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed">
              {selectedPersona.analysisFocus.join(' • ')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
