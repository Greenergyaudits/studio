"use client"

import * as React from "react"
import useEmblaCarousel, { type EmblaCarouselType } from "embla-carousel-react"

import { cn } from "@/lib/utils"

type NumberCarouselApi = EmblaCarouselType | undefined
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]

type NumberCarouselProps = {
  opts?: CarouselOptions,
  setValue: (value: number) => void,
  value: number,
  range: [number, number]
}

const NumberCarouselContext = React.createContext<{
  api: NumberCarouselApi,
  options: CarouselOptions,
  value: number,
  range: [number, number],
  numbers: number[]
} | null>(null)

function useNumberCarousel() {
  const context = React.useContext(NumberCarouselContext)
  if (!context) {
    throw new Error("useNumberCarousel must be used within a <NumberCarousel />")
  }
  return context
}

const NumberCarousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & NumberCarouselProps
>(
  ({ opts, setValue, value, range, className, children, ...props }, ref) => {
    const numbers = React.useMemo(() => Array.from({ length: range[1] - range[0] + 1 }, (_, i) => i + range[0]), [range]);
    const [emblaRef, api] = useEmblaCarousel({
      axis: "y",
      loop: false,
      align: "center",
      startIndex: numbers.indexOf(value),
      ...opts,
    }, [])

    React.useEffect(() => {
        if (!api) return;
    
        const onSelect = (emblaApi: EmblaCarouselType) => {
            const selectedIndex = emblaApi.selectedScrollSnap();
            setValue(numbers[selectedIndex]);
        };
    
        api.on("select", onSelect);
        api.on("reInit", onSelect);
    
        // If the external value changes, scroll to it
        const currentIndex = api.selectedScrollSnap();
        const targetIndex = numbers.indexOf(value);
        if (currentIndex !== targetIndex && targetIndex !== -1) {
            api.scrollTo(targetIndex);
        }
    
        return () => {
            api.off("select", onSelect);
            api.off("reInit", onSelect);
        };
    }, [api, numbers, setValue, value]);
    

    const contextValue = React.useMemo(() => ({
      api,
      options: opts || {},
      value,
      range,
      numbers,
    }), [api, opts, value, range, numbers]);

    return (
      <NumberCarouselContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn("relative", className)}
          {...props}
        >
          <div ref={emblaRef} className="overflow-hidden h-48">
            <div
              className="-mt-4 flex-col"
            >
              {children}
            </div>
          </div>
        </div>
      </NumberCarouselContext.Provider>
    )
  }
)
NumberCarousel.displayName = "NumberCarousel"

const NumberCarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { numbers, value } = useNumberCarousel();

  return (
    <div ref={ref} className={cn("flex flex-col items-center justify-start h-full", className)}>
      {numbers.map((num, index) => (
        <div 
          key={index} 
          className={cn(
            "flex items-center justify-center min-w-0 shrink-0 grow-0 basis-full pt-4 text-2xl transition-opacity",
            num === value ? "opacity-100 font-semibold" : "opacity-30"
          )}
        >
          {num}
        </div>
      ))}
    </div>
  )
})
NumberCarouselContent.displayName = "NumberCarouselContent"


export { NumberCarousel, NumberCarouselContent }
