import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { Calendar, MapPin, Clock, ArrowRight, Bell, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image_url?: string;
  images?: string[]; // Added back for compatibility with render logic
}

const Events: React.FC = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`/api/${collegeSlug}/events`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load events",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [collegeSlug]);

  return (
    <motion.div
      className="min-h-screen pt-20 pb-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-gradient-to-br from-secondary to-background py-12 lg:py-16 text-center">
        <div className="container">
          <motion.h1
            className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            College Events
          </motion.h1>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Stay updated with the latest happenings, seminars, and book fairs at
            our library.
          </motion.p>
        </div>
      </div>

      <div className="container py-12">
        {loading ? (
          <div className="space-y-12">
            {[1, 2].map((i) => (
              <div key={i} className="grid lg:grid-cols-2 gap-8 border rounded-2xl p-6">
                <div className="space-y-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-32 w-full" />
                </div>
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 gap-12">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="overflow-hidden border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="grid lg:grid-cols-2 gap-0">
                    <div className="p-6 lg:p-10 space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary font-medium text-sm">
                          <Calendar className="w-4 h-4" />
                          {event.date
                            ? new Date(event.date).toLocaleDateString(
                                undefined,
                                { dateStyle: "long" },
                              )
                            : "Date TBD"}
                        </div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                          {event.title}
                        </h2>
                      </div>

                      <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">
                        {event.description}
                      </p>
                    </div>

                    <div className="bg-muted flex items-center justify-center p-4 lg:p-8">
                      {event.images && event.images.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 w-full">
                          <div className="aspect-video relative rounded-lg overflow-hidden border shadow-inner bg-background">
                            <img
                              src={event.images[0]}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {event.images.length > 1 && (
                            <div className="grid grid-cols-3 gap-2">
                              {event.images.slice(1, 4).map((img, idx) => (
                                <div
                                  key={idx}
                                  className="aspect-square rounded-md overflow-hidden border bg-background"
                                >
                                  <img
                                    src={img}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                          <p className="text-sm">No images available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Events Yet</h3>
            <p className="text-muted-foreground">
              Check back later for upcoming library events.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Events;
