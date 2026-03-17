import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { User, Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useCollege } from "@/contexts/CollegeContext";
import { Skeleton } from "@/components/ui/skeleton";

interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  description?: string;
  imageUrl?: string;
}

const Faculty: React.FC = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const { settings } = useCollege();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const response = await fetch(`/api/${collegeSlug}/faculty`);
        if (response.ok) {
          const data = await response.json();
          setFaculty(data);
        }
      } catch (error) {
        console.error("Failed to fetch faculty", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFaculty();
  }, [collegeSlug]);

  return (
    <motion.div
      className="min-h-screen pt-24 pb-12 pakistan-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Faculty & Staff
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Meet the dedicated educators and staff members who make{" "}
            {settings.instituteShortName} a center of excellence.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4 p-6 border rounded-xl bg-card">
                <Skeleton className="aspect-[4/3] rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : faculty.length === 0 ? (
          <div className="py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <User size={48} className="text-primary/30" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              No Faculty Listed
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              The faculty and staff directory is currently empty for this institution.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {faculty.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-colors group overflow-hidden">
                  <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                    {member.imageUrl ? (
                      <img
                        src={member.imageUrl}
                        alt={member.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <User size={64} className="opacity-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6"></div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {member.name}
                    </CardTitle>
                    <CardDescription className="font-medium text-primary/80">
                      {member.designation}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {member.description ||
                        `Dedicated faculty member of ${settings.instituteFullName}.`}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Faculty;
