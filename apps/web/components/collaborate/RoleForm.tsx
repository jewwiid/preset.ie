'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus } from 'lucide-react';
import { Combobox, MultiSelectCombobox } from '@/components/ui/combobox';

interface RoleFormData {
  role_name: string;
  skills_required: string[];
  is_paid: boolean;
  compensation_details: string;
  headcount: number;
}

interface RoleFormProps {
  role: RoleFormData;
  index: number;
  onUpdate: (index: number, field: keyof RoleFormData, value: any) => void;
  onRemove: (index: number) => void;
}

interface PredefinedRole {
  id: string;
  name: string;
  category: string;
  description: string;
  sort_order: number;
}

interface PredefinedSkill {
  id: string;
  name: string;
  category: string;
  description: string;
  sort_order: number;
}


export function RoleForm({ role, index, onUpdate, onRemove }: RoleFormProps) {
  const [customRoleName, setCustomRoleName] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [predefinedRoles, setPredefinedRoles] = useState<string[]>([]);
  const [predefinedSkills, setPredefinedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch predefined roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesResponse = await fetch('/api/collab/predefined/roles');
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json();
          const roles = rolesData.roles.map((r: PredefinedRole) => r.name);
          console.log('RoleForm: Fetched roles:', roles.length);
          setPredefinedRoles(roles);
        } else {
          console.error('RoleForm: Failed to fetch roles, status:', rolesResponse.status);
        }
      } catch (error) {
        console.error('RoleForm: Error fetching predefined roles:', error);
        setPredefinedRoles([]);
      } finally {
        console.log('RoleForm: Setting loading to false');
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // Fetch skills based on selected role
  useEffect(() => {
    const fetchSkills = async () => {
      if (!role.role_name) {
        setPredefinedSkills([]);
        return;
      }

      try {
        const skillsResponse = await fetch(`/api/collab/predefined/skills?role=${encodeURIComponent(role.role_name)}`);
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json();
          const skills = skillsData.skills.map((s: PredefinedSkill) => s.name);
          console.log(`RoleForm: Fetched skills for role "${role.role_name}":`, skills.length);
          setPredefinedSkills(skills);
        } else {
          console.error('RoleForm: Failed to fetch skills, status:', skillsResponse.status);
        }
      } catch (error) {
        console.error('RoleForm: Error fetching predefined skills:', error);
        setPredefinedSkills([]);
      }
    };

    fetchSkills();
  }, [role.role_name]);

  const handleRoleNameChange = (value: string) => {
    onUpdate(index, 'role_name', value);
  };

  const handleCustomRoleNameSubmit = () => {
    if (customRoleName.trim() && !predefinedRoles.includes(customRoleName.trim())) {
      onUpdate(index, 'role_name', customRoleName.trim());
      setCustomRoleName('');
    }
  };

  const handleSkillsChange = (skills: string[]) => {
    onUpdate(index, 'skills_required', skills);
  };

  const handleCustomSkillSubmit = () => {
    if (customSkill.trim() && !role.skills_required.includes(customSkill.trim())) {
      onUpdate(index, 'skills_required', [...role.skills_required, customSkill.trim()]);
      setCustomSkill('');
    }
  };


  const removeSkill = (skillToRemove: string) => {
    onUpdate(index, 'skills_required', role.skills_required.filter(skill => skill !== skillToRemove));
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-muted rounded mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex justify-between items-center">
        <h4 className="text-base font-medium">Role {index + 1}</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRemove(index)}
          className="text-destructive hover:text-destructive"
        >
          <X className="h-4 w-4 mr-1" />
          Remove
        </Button>
      </div>

      {/* Role Name Selection */}
      <div className="space-y-2">
        <Label>Role Name *</Label>
        <div className="space-y-2">
          <Combobox
            value={role.role_name}
            onValueChange={handleRoleNameChange}
            options={predefinedRoles}
            placeholder="Select a role type..."
            emptyText="No role types found."
          />
          
          {/* Custom Role Name Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Or enter a custom role name..."
              value={customRoleName}
              onChange={(e) => setCustomRoleName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCustomRoleNameSubmit()}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCustomRoleNameSubmit}
              disabled={!customRoleName.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Skills Selection */}
      <div className="space-y-2">
        <Label>Required Skills</Label>
        <div className="space-y-2">
          <MultiSelectCombobox
            values={role.skills_required}
            onValuesChange={handleSkillsChange}
            options={predefinedSkills}
            placeholder="Select required skills..."
            emptyText="No skills found."
            maxSelections={10}
          />
          
          {/* Custom Skill Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Or add a custom skill..."
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCustomSkillSubmit()}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCustomSkillSubmit}
              disabled={!customSkill.trim() || role.skills_required.includes(customSkill.trim())}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Selected Skills Display */}
          {role.skills_required.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {role.skills_required.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {skill}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 hover:bg-transparent"
                    onClick={() => removeSkill(skill)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Headcount and Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`headcount-${index}`}>Headcount</Label>
          <Input
            id={`headcount-${index}`}
            type="number"
            min="1"
            value={role.headcount}
            onChange={(e) => onUpdate(index, 'headcount', parseInt(e.target.value) || 1)}
            className="w-full"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id={`paid-${index}`}
            checked={role.is_paid}
            onCheckedChange={(checked) => onUpdate(index, 'is_paid', checked)}
          />
          <Label htmlFor={`paid-${index}`}>This role is paid</Label>
        </div>
      </div>

      {/* Compensation Details */}
      {role.is_paid && (
        <div>
          <Label htmlFor={`compensation-${index}`}>Compensation Details</Label>
          <Textarea
            id={`compensation-${index}`}
            placeholder="Describe compensation, rates, etc."
            value={role.compensation_details}
            onChange={(e) => onUpdate(index, 'compensation_details', e.target.value)}
            rows={2}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
