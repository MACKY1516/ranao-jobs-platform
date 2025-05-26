"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface EmployerRatingProps {
  employerId: string
  employerName: string
  initialRating?: number
  showRatingButton?: boolean
  size?: "sm" | "md" | "lg"
  directMode?: boolean
  onRatingSubmit?: (rating: number, feedback: string, anonymous: boolean) => void
}

export function EmployerRating({
  employerId,
  employerName,
  initialRating = 0,
  showRatingButton = true,
  size = "md",
  directMode = false,
  onRatingSubmit,
}: EmployerRatingProps) {
  const [rating, setRating] = useState(initialRating)
  const [hoverRating, setHoverRating] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasRated, setHasRated] = useState(initialRating > 0)
  const [showThankYou, setShowThankYou] = useState(false)

  // Determine star size based on the size prop
  const starSize = {
    sm: 16,
    md: 20,
    lg: 24,
  }[size]

  const handleRatingSubmit = () => {
    if (rating === 0) return;
    
    setIsSubmitting(true)

    // If in direct mode and onRatingSubmit callback provided, use that
    if (directMode && onRatingSubmit) {
      onRatingSubmit(rating, feedback, isAnonymous);
      setIsSubmitting(false);
      return;
    }

    // Simulate API call to save rating
    setTimeout(() => {
      setIsSubmitting(false)
      setIsDialogOpen(false)
      setHasRated(true)
      setShowThankYou(true)

      // Hide thank you message after 3 seconds
      setTimeout(() => {
        setShowThankYou(false)
      }, 3000)

      // In a real app, you would save the rating to your database
      console.log(`Rating submitted for ${employerName} (${employerId}): ${rating} stars`)
      console.log(`Feedback: ${feedback}`)
    }, 1000)
  }

  const renderStars = (interactive = false) => {
    return Array(5)
      .fill(0)
      .map((_, index) => {
        const starValue = index + 1
        const isFilled = interactive ? starValue <= (hoverRating || rating) : starValue <= rating

        return (
          <Star
            key={index}
            size={starSize}
            className={`${isFilled ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} transition-colors ${interactive ? 'cursor-pointer' : ''}`}
            onClick={interactive ? () => setRating(starValue) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(starValue) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          />
        )
      })
  }

  // Render in direct mode - just the rating UI without dialog wrapper
  if (directMode) {
    return (
      <div className="flex flex-col items-center py-4 space-y-4 w-full">
        <div className="flex items-center space-x-1">{renderStars(true)}</div>

        <Textarea
          placeholder="Share your experience with this employer"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-full"
          rows={4}
        />

        <div className="flex items-center space-x-2 w-full">
          <Switch
            id="anonymous"
            checked={isAnonymous}
            onCheckedChange={setIsAnonymous}
          />
          <Label htmlFor="anonymous">Post anonymously</Label>
        </div>

        <Button
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
          onClick={handleRatingSubmit}
          disabled={rating === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></span>
              Submitting...
            </span>
          ) : (
            "Submit Rating"
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {renderStars(false)}
        {rating > 0 && <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>}
      </div>

      {showRatingButton && !hasRated && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-gray-500 hover:text-yellow-600"
          onClick={() => setIsDialogOpen(true)}
        >
          Rate
        </Button>
      )}

      {showThankYou && <span className="text-xs text-green-600 animate-fade-in">Thank you for your rating!</span>}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate {employerName}</DialogTitle>
            <DialogDescription>
              Share your experience with this employer. Your feedback helps other job seekers.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center py-4 space-y-4">
            <div className="flex items-center space-x-1">{renderStars(true)}</div>

            <Textarea
              placeholder="Share your experience with this employer (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full"
            />
            
            <div className="flex items-center space-x-2 w-full">
              <Switch
                id="anonymous-dialog"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <Label htmlFor="anonymous-dialog">Post anonymously</Label>
            </div>
          </div>

          <DialogFooter className="flex space-x-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
              onClick={handleRatingSubmit}
              disabled={rating === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></span>
                  Submitting...
                </span>
              ) : (
                "Submit Rating"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
