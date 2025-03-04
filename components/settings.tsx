import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "next-themes"
import bedrockModels from "@/bedrock-models.json"

type SettingsProps = {
  isOpen: boolean
  onClose: () => void
  textModel: string
  imageModel: string
  onTextModelChange: (model: string) => void
  onImageModelChange: (model: string) => void
}

// Filter text models (Amazon provider, text input/output)
const textModels = bedrockModels.modelSummaries.filter(
  model => 
    model.providerName === "Amazon" && 
    model.inputModalities.includes("TEXT") && 
    model.outputModalities.includes("TEXT") &&
    model.modelLifecycle.status === "ACTIVE" &&
    model.inferenceTypesSupported.includes("ON_DEMAND")
)

// Filter image models (Amazon provider, text input, image output)
const imageModels = bedrockModels.modelSummaries.filter(
  model => 
    model.providerName === "Amazon" && 
    model.inputModalities.includes("TEXT") && 
    model.outputModalities.includes("IMAGE") &&
    model.modelLifecycle.status === "ACTIVE" &&
    model.inferenceTypesSupported.includes("ON_DEMAND")
)

export function Settings({ 
  isOpen, 
  onClose, 
  textModel,
  imageModel,
  onTextModelChange,
  onImageModelChange
}: SettingsProps) {
  const { theme, setTheme } = useTheme()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="textModel">Text Generation Model</Label>
            <Select value={textModel} onValueChange={onTextModelChange}>
              <SelectTrigger id="textModel">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {textModels.map((model) => (
                  <SelectItem key={model.modelId} value={model.modelId}>
                    {model.modelName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="imageModel">Image Generation Model</Label>
            <Select value={imageModel} onValueChange={onImageModelChange}>
              <SelectTrigger id="imageModel">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {imageModels.map((model) => (
                  <SelectItem key={model.modelId} value={model.modelId}>
                    {model.modelName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

