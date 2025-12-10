import { Button } from "@/components/ui/button";
import { Sparkles, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AIGuideChat from "./AIGuideChat";

interface AIGuideButtonProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AIGuideButton = ({ open: controlledOpen, onOpenChange }: AIGuideButtonProps = {}) => {
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : false;
  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    }
  };

  return (
    <>
      {/* Floating AI Guide Button */}
      <Button
        size="lg"
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-ai bg-gradient-ai hover:scale-110 transition-transform duration-300 z-40"
      >
        <Sparkles className="h-6 w-6 text-white" />
      </Button>

      {/* AI Guide Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="h-8 w-8 rounded-lg bg-gradient-ai flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              AI智能导购
            </DialogTitle>
            <DialogDescription>
              告诉我您的需求，我会为您推荐最合适的商品
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <AIGuideChat onClose={() => setOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIGuideButton;
