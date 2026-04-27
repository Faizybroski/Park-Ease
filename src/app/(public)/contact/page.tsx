"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import PageHero from "@/components/shared/PageHero";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormValues = z.infer<typeof formSchema>;

const items = [
  {
    icon: Mail,
    title: "Email",
    value: "parkeaseparking@gmail.com",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
  icon: MessageCircle,
  title: "WhatsApp",
  value: "+44 7508 624155",
  color: "text-emerald-600 dark:text-emerald-400",
  bg: "bg-emerald-100 dark:bg-emerald-900/30",
},
  {
    icon: Phone,
    title: "Phone",
    value: "07508624155",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  {
    icon: MapPin,
    title: "Address",
    value: "103 Pennine Way UB3 5LJ",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  {
    icon: Clock,
    title: "Hours",
    value: "Open 24/7, 365 days a year",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
];

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      await api.contact(data);
      setSubmitted(true);
      form.reset();
    } catch (err: unknown) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero title="Contact Us" subtitle="We're here to help" />
      <section className="py-16 max-w-4xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="rounded-2xl border border-primary/50 bg-card dark:bg-white/6 p-6 text-center text-card-foreground ring-0 lg:p-8">
            <CardHeader className="p-0">
              <CardTitle className="text-xl font-bold mb-6 text-primary dark:text-primaryblue">
                Send us a message
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              {submitted && (
                <Alert variant={"success"} className="mb-4">
                  <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
                  <AlertDescription>
                    Message sent successfully. We&apos;ll get back to you soon.
                  </AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Message</FormLabel>
                        <FormControl>
                          <Textarea rows={6} placeholder="Type your message..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.formState.errors.root && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Something went wrong. Please try again.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-4">
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl  p-5 flex items-start gap-4 border bg-card border-primary/50 ring-0 dark:bg-white/6 shadow-lg hover:bg-primary/5 hover:scale-105 duration-300"
                >
                  <div className={`w-11 h-11 flex items-center justify-center rounded-xl ${item.bg} shrink-0 transition`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
