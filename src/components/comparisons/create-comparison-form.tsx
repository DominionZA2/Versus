"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/components/ui/use-toast'
import { Plus } from 'lucide-react'

type FormData = {
  name: string
}

export default function CreateComparisonForm() {
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const form = useForm<FormData>({
    defaultValues: {
      name: '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsCreating(true)

    try {
      const response = await fetch('/api/comparisons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create comparison')
      }

      const { comparison } = await response.json()
      
      toast({
        title: "Success",
        description: "Comparison created successfully",
      })
      
      form.reset()
      router.refresh()
      router.push(`/comparisons/${comparison.slug}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create comparison",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="sr-only">Comparison Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter comparison name..."
                      disabled={isCreating}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}