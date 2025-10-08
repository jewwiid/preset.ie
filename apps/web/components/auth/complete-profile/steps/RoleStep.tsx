'use client'

import { useCompleteProfile } from '../CompleteProfileProvider'
import { Button } from '../../../ui/button'
import { Camera, Users, Sparkles, ArrowRight } from 'lucide-react'

export function RoleStep() {
  const { handleRoleSelection } = useCompleteProfile()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          How will you use Preset?
        </h2>
        <p className="text-muted-foreground">
          Choose your primary role (you can change this later)
        </p>
      </div>

      <div className="grid gap-4">
        <Button
          onClick={() => handleRoleSelection('CONTRIBUTOR')}
          variant="outline"
          className="p-6 h-auto justify-start text-left group hover:border-primary hover:bg-primary/10"
        >
          <div className="flex items-start w-full">
            <Camera className="w-8 h-8 text-primary mr-4 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                I'm a Contributor
              </h3>
              <p className="text-muted-foreground">
                I'm a photographer, videographer, or cinematographer looking for talent for my shoots
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary ml-auto flex-shrink-0" />
          </div>
        </Button>

        <Button
          onClick={() => handleRoleSelection('TALENT')}
          variant="outline"
          className="p-6 h-auto justify-start text-left group hover:border-primary hover:bg-primary/10"
        >
          <div className="flex items-start w-full">
            <Users className="w-8 h-8 text-primary mr-4 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                I'm Talent
              </h3>
              <p className="text-muted-foreground">
                I'm a model, actor, or creative looking to collaborate on shoots
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary ml-auto flex-shrink-0" />
          </div>
        </Button>

        <Button
          onClick={() => handleRoleSelection('BOTH')}
          variant="outline"
          className="p-6 h-auto justify-start text-left group hover:border-primary hover:bg-primary/10"
        >
          <div className="flex items-start w-full">
            <Sparkles className="w-8 h-8 text-primary mr-4 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                I do both
              </h3>
              <p className="text-muted-foreground">
                I'm both a creative professional and talent
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary ml-auto flex-shrink-0" />
          </div>
        </Button>
      </div>
    </div>
  )
}
