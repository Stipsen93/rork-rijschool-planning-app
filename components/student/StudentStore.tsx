import createContextHook from "@nkzw/create-context-hook";
import { useState, useCallback, useMemo } from "react";

export interface Instructor {
  name: string;
  photo: string;
  rating: number;
}

export interface NextLesson {
  instructor: Instructor;
  date: Date;
  time: string;
  type: string;
  location: string;
  countdown: {
    days: number;
    hours: number;
    minutes: number;
  };
}

export interface SkillProgress {
  parking: number;
  highway: number;
  cityDriving: number;
  nightDriving: number;
  weatherConditions: number;
}

export interface ProgressData {
  totalLessons: number;
  hoursDriven: number;
  skillsProgress: SkillProgress;
  overallProgress: number;
}

export interface Activity {
  id: number;
  date: Date;
  duration: number;
  instructor: string;
  instructorPhoto: string;
  rating: number;
  lessonType: string;
  skillsImproved: string[];
  instructorNotes: string;
  studentNotes: string;
  isExpanded: boolean;
}

export interface StudentData {
  name: string;
  profileImage: string;
  lessonStreak: number;
  level: string;
  nextLesson: NextLesson;
}

export const [StudentProvider, useStudent] = createContextHook(() => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  const [studentData, setStudentData] = useState<StudentData>({
    name: "Emma Jansen",
    profileImage:
      "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
    lessonStreak: 7,
    level: "Gevorderd",
    nextLesson: {
      instructor: {
        name: "Jan van der Berg",
        photo:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        rating: 4.8,
      },
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      time: "14:00 - 15:30",
      type: "Stadsrijden",
      location: "Rijschool Centrum",
      countdown: {
        days: 2,
        hours: 3,
        minutes: 24,
      },
    },
  });

  const [progressData, setProgressData] = useState<ProgressData>({
    totalLessons: 45,
    hoursDriven: 67.5,
    skillsProgress: {
      parking: 0.85,
      highway: 0.72,
      cityDriving: 0.91,
      nightDriving: 0.43,
      weatherConditions: 0.67,
    },
    overallProgress: 0.72,
  });

  const [recentActivity, setRecentActivity] = useState<Activity[]>([
    {
      id: 1,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      duration: 90,
      instructor: "Jan van der Berg",
      instructorPhoto:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      rating: 5.0,
      lessonType: "Stadsrijden",
      skillsImproved: ["Parkeren", "Voorrang verlenen"],
      instructorNotes:
        "Uitstekende vooruitgang met parkeren. Blijf oefenen met inparkeren in krappe ruimtes.",
      studentNotes: "Ik voel me veel zekerder bij het parkeren nu!",
      isExpanded: false,
    },
    {
      id: 2,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      duration: 90,
      instructor: "Maria Jansen",
      instructorPhoto:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      rating: 4.5,
      lessonType: "Snelweg",
      skillsImproved: ["Invoegen", "Afstand houden"],
      instructorNotes:
        "Goed werk op de snelweg. Focus volgende keer op snelheidsregeling bij invoegen.",
      studentNotes: "Snelweg rijden ging beter dan verwacht!",
      isExpanded: false,
    },
    {
      id: 3,
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      duration: 90,
      instructor: "Peter de Vries",
      instructorPhoto:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 4.8,
      lessonType: "Nachtrijden",
      skillsImproved: ["Verlichting", "Zicht aanpassen"],
      instructorNotes:
        "Eerste nachtles ging goed. Belangrijk om vertrouwd te raken met beperkt zicht.",
      studentNotes: "Nachtrijden was spannend maar leerzaam.",
      isExpanded: false,
    },
    {
      id: 4,
      date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      duration: 90,
      instructor: "Anna Bakker",
      instructorPhoto:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
      rating: 4.7,
      lessonType: "Stadsrijden",
      skillsImproved: ["Rotondes", "Verkeerslichten"],
      instructorNotes:
        "Goede vooruitgang met complexe verkeerssituaties. Meer oefening met rotondes nodig.",
      studentNotes: "Rotondes zijn nog een uitdaging voor me.",
      isExpanded: false,
    },
    {
      id: 5,
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      duration: 90,
      instructor: "Tom Hendriks",
      instructorPhoto:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      rating: 4.9,
      lessonType: "Basisvaardigheden",
      skillsImproved: ["Schakelen", "Koppeling"],
      instructorNotes:
        "Uitstekende controle over voertuig. Klaar voor meer geavanceerde technieken.",
      studentNotes: "Eindelijk soepel schakelen!",
      isExpanded: false,
    },
  ]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    console.log("Loading student data...");

    await new Promise((resolve) => setTimeout(resolve, 1200));

    setIsLoading(false);
    setLastSyncTime(new Date());
    console.log("Student data loaded successfully");
  }, []);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    console.log("Refreshing student data...");

    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsRefreshing(false);
    setLastSyncTime(new Date());
    console.log("Student data refreshed successfully");
    return true;
  }, []);

  const toggleActivityExpansion = useCallback((activityId: number) => {
    setRecentActivity((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? { ...activity, isExpanded: !activity.isExpanded }
          : activity
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      isLoading,
      isRefreshing,
      lastSyncTime,
      studentData,
      progressData,
      recentActivity,
      loadData,
      refreshData,
      toggleActivityExpansion,
    }),
    [
      isLoading,
      isRefreshing,
      lastSyncTime,
      studentData,
      progressData,
      recentActivity,
      loadData,
      refreshData,
      toggleActivityExpansion,
    ]
  );

  return value;
});
