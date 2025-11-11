'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

type ArmValue = 'left' | 'right';
type PositionValue = 'sitting' | 'laying' | 'standing';
type ConditionValue = 'before' | 'after';
type Conditions = {
  meal?: ConditionValue;
  medicine?: ConditionValue;
  activity?: ConditionValue;
};

// --- Arm Selection Dialog ---
interface ArmSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  value?: ArmValue;
  onChange: (value: ArmValue) => void;
}

export function ArmSelectionDialog({ isOpen, onOpenChange, value, onChange }: ArmSelectionDialogProps) {
  const handleSave = () => {
    // The value is already updated via onValueChange, so we just close.
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Arm</DialogTitle>
        </DialogHeader>
        <RadioGroup value={value} onValueChange={(v: ArmValue) => onChange(v)} className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="left" id="arm-left" />
            <Label htmlFor="arm-left" className="text-base">Left</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="right" id="arm-right" />
            <Label htmlFor="arm-right" className="text-base">Right</Label>
          </div>
        </RadioGroup>
        <DialogFooter>
          <DialogClose asChild>
             <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Position Selection Dialog ---
interface PositionSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  value?: PositionValue;
  onChange: (value: PositionValue) => void;
}

export function PositionSelectionDialog({ isOpen, onOpenChange, value, onChange }: PositionSelectionDialogProps) {
    const handleSave = () => onOpenChange(false);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Select Position</DialogTitle>
            </DialogHeader>
            <RadioGroup value={value} onValueChange={(v: PositionValue) => onChange(v)} className="grid gap-4 py-4">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sitting" id="pos-sitting" />
                    <Label htmlFor="pos-sitting" className="text-base">Sitting Down</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="laying" id="pos-laying" />
                    <Label htmlFor="pos-laying" className="text-base">Laying Down</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="standing" id="pos-standing" />
                    <Label htmlFor="pos-standing" className="text-base">Standing</Label>
                </div>
            </RadioGroup>
            <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    );
}

// --- Conditions Selection Dialog ---
interface ConditionsSelectionDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    value?: Conditions;
    onChange: (value: Conditions) => void;
}

function ConditionGroup({ title, value, onChange }: { title: string, value?: ConditionValue, onChange: (v: ConditionValue) => void }) {
    return (
        <div className="space-y-3">
            <h4 className="font-medium text-muted-foreground">{title}</h4>
             <RadioGroup value={value} onValueChange={onChange} className="flex gap-4">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="before" id={`${title}-before`} />
                    <Label htmlFor={`${title}-before`}>Before</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="after" id={`${title}-after`} />
                    <Label htmlFor={`${title}-after`}>After</Label>
                </div>
             </RadioGroup>
        </div>
    )
}

export function ConditionsSelectionDialog({ isOpen, onOpenChange, value = {}, onChange }: ConditionsSelectionDialogProps) {
    const handleSave = () => onOpenChange(false);
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select Conditions</DialogTitle>
                    <DialogDescription>
                        Specify conditions at the time of the reading. These are all optional.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                   <ConditionGroup 
                        title="Meal"
                        value={value.meal}
                        onChange={(v) => onChange({ ...value, meal: v })}
                   />
                   <ConditionGroup 
                        title="Medicine"
                        value={value.medicine}
                        onChange={(v) => onChange({ ...value, medicine: v })}
                   />
                   <ConditionGroup 
                        title="Activity"
                        value={value.activity}
                        onChange={(v) => onChange({ ...value, activity: v })}
                   />
                </div>
                 <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
