"use client"

import * as React from "react"
import { format, setMonth, setYear, getMonth, getYear } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxDate?: Date
  minDate?: Date
  error?: boolean
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
  maxDate,
  minDate,
  error = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState<Date>(date || new Date())

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  // Generate year range (100 years back from current year for birth dates)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

  const handleMonthChange = (month: string) => {
    const newDate = setMonth(currentMonth, months.indexOf(month))
    setCurrentMonth(newDate)
  }

  const handleYearChange = (year: string) => {
    const newDate = setYear(currentMonth, parseInt(year))
    setCurrentMonth(newDate)
  }

  const handlePreviousMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentMonth(newDate)
  }

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentMonth(newDate)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3 py-2",
            "border-border-300 hover:border-primary-500 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20",
            "transition-all duration-200",
            !date && "text-muted-foreground-500",
            error && "border-destructive-300 focus:border-destructive-500 focus:ring-destructive-primary",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground-400" />
          {date ? (
            <span className="text-muted-foreground-900">{format(date, "MM/dd/yyyy")}</span>
          ) : (
            <span className="text-muted-foreground-500">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 border-border-200 shadow-lg max-w-[95vw] sm:max-w-none" 
        align="start"
        sideOffset={5}
      >
        <div className="p-3 border-b border-border-200 bg-muted-50">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-7 sm:w-7 hover:bg-muted-100 shrink-0"
              onClick={handlePreviousMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-1 flex-1 min-w-0">
              <Select
                value={months[getMonth(currentMonth)]}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="h-8 sm:h-7 text-xs sm:text-xs border-0 focus:ring-0 font-medium flex-1 min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[40vh] sm:max-h-[200px]">
                  {months.map((month) => (
                    <SelectItem 
                      key={month} 
                      value={month} 
                      className="text-sm sm:text-xs py-2 sm:py-1"
                    >
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={getYear(currentMonth).toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="h-8 sm:h-7 w-[70px] sm:w-20 text-xs sm:text-xs border-0 focus:ring-0 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[40vh] sm:max-h-[200px]">
                  {years.map((year) => (
                    <SelectItem 
                      key={year} 
                      value={year.toString()} 
                      className="text-sm sm:text-xs py-2 sm:py-1"
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-7 sm:w-7 hover:bg-muted-100 shrink-0"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onDateChange?.(selectedDate)
            setOpen(false)
          }}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          initialFocus
          disabled={(date) => {
            if (maxDate && date > maxDate) return true
            if (minDate && date < minDate) return true
            return false
          }}
          className="rounded-b-lg p-3"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "hidden", // Hide default caption since we have custom controls
            caption_label: "hidden",
            nav: "hidden", // Hide default nav since we have custom controls
            table: "w-full border-collapse",
            head_row: "flex justify-around",
            head_cell: cn(
              "text-muted-foreground-500 rounded-md font-normal text-[0.8rem]",
              "w-10 h-8 sm:w-9 sm:h-auto", // Larger on mobile for better touch
              "flex items-center justify-center"
            ),
            row: "flex w-full mt-1 justify-around",
            cell: cn(
              "relative text-center text-sm p-0",
              "h-10 w-10 sm:h-9 sm:w-9", // Larger touch targets on mobile
              "focus-within:relative focus-within:z-20",
              // Mobile touch target optimization
              "touch-manipulation"
            ),
            day: cn(
              "h-10 w-10 sm:h-9 sm:w-9 p-0 font-normal",
              "inline-flex items-center justify-center rounded-md text-sm",
              "ring-offset-white transition-colors",
              "hover:bg-muted-100 hover:text-muted-foreground-900",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-primary focus-visible:ring-offset-2",
              "aria-selected:opacity-100",
              // Mobile touch optimization
              "active:scale-95 touch-manipulation",
              // Better touch feedback
              "tap-highlight-transparent"
            ),
            day_selected: cn(
              "bg-primary-600 text-primary-foreground hover:bg-primary-600 hover:text-primary-foreground",
              "focus:bg-primary-600 focus:text-primary-foreground",
              "font-semibold"
            ),
            day_today: "bg-primary-100 text-primary-900 font-semibold border border-primary/30",
            day_outside: "text-muted-foreground-400 opacity-50",
            day_disabled: "text-muted-foreground-400 opacity-50 cursor-not-allowed",
            day_range_middle: "aria-selected:bg-muted-100 aria-selected:text-muted-foreground-900",
            day_hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}