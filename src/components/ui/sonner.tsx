import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-0 group-[.toaster]:shadow-primary group-[.toaster]:backdrop-blur-md group-[.toaster]:rounded-xl group-[.toaster]:border group-[.toaster]:border-border/50",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          title: "group-[.toast]:text-foreground group-[.toast]:font-semibold group-[.toast]:text-base",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium group-[.toast]:px-3 group-[.toast]:py-1.5",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium group-[.toast]:px-3 group-[.toast]:py-1.5",
          icon: "group-[.toast]:text-primary",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
