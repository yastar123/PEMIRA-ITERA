type VariantConfig = {
  variants?: Record<string, Record<string, string>>
  defaultVariants?: Record<string, string>
}

export function cva(base: string, config?: VariantConfig) {
  return (props?: Record<string, string | undefined>) => {
    let classes = base

    if (config?.variants && props) {
      Object.entries(props).forEach(([key, value]) => {
        if (value && config.variants?.[key]?.[value]) {
          classes += " " + config.variants[key][value]
        }
      })
    }

    // Apply default variants if no value provided
    if (config?.defaultVariants) {
      Object.entries(config.defaultVariants).forEach(([key, defaultValue]) => {
        if (!props?.[key] && config.variants?.[key]?.[defaultValue]) {
          classes += " " + config.variants[key][defaultValue]
        }
      })
    }

    return classes
  }
}

export type VariantProps<T extends (...args: any) => any> = {
  [K in keyof Parameters<T>[0]]?: Parameters<T>[0][K]
}
