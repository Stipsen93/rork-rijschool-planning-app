import 'package:flutter/material.dart';

import '../../../core/app_export.dart';
import '../../../services/lessons_service.dart';
import './widgets/next_appointment_widget.dart';
import './widgets/performance_metrics_widget.dart';
import './widgets/student_activity_dashboard_widget.dart';
import './widgets/weekly_earnings_widget.dart';

class InstructorOverviewScreen extends StatefulWidget {
  const InstructorOverviewScreen({super.key});

  @override
  State<InstructorOverviewScreen> createState() =>
      _InstructorOverviewScreenState();
}

class _InstructorOverviewScreenState extends State<InstructorOverviewScreen>
    with TickerProviderStateMixin {
  final LessonsService _lessonsService = LessonsService();
  late Future<Map<String, dynamic>> _overviewDataFuture;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _overviewDataFuture = _loadOverviewData();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Column(
        children: [
          // App bar content
          AppBar(
            automaticallyImplyLeading: false,
            title: Text(
              'Overzicht',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
            ),
            elevation: 0,
            backgroundColor: Colors.transparent,
            actions: [
              IconButton(
                onPressed: () {
                  setState(() {
                    _overviewDataFuture = _loadOverviewData();
                  });
                },
                icon: const Icon(Icons.refresh),
                tooltip: 'Gegevens vernieuwen',
              ),
              IconButton(
                onPressed: () {
                  Navigator.pushNamed(
                      context, AppRoutes.instructorSettingsNavigation);
                },
                icon: const Icon(Icons.settings),
                tooltip: 'Instellingen',
              ),
              const SizedBox(width: 8),
            ],
          ),
          // Body content
          Expanded(
            child: FutureBuilder<Map<String, dynamic>>(
              future: _overviewDataFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return _buildLoadingSkeleton(isDark);
                }

                if (snapshot.hasError) {
                  return _buildErrorState();
                }

                final data = snapshot.data!;

                return RefreshIndicator(
                  onRefresh: () async {
                    setState(() {
                      _overviewDataFuture = _loadOverviewData();
                    });
                  },
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 8),

                        // Next appointment
                        NextAppointmentWidget(
                          appointment: data['nextAppointment'],
                        ),

                        const SizedBox(height: 24),

                        // Student Activity Dashboard - Main feature
                        StudentActivityDashboardWidget(
                          studentActivity: data['studentActivity'],
                        ),

                        const SizedBox(height: 24),

                        // Performance metrics
                        PerformanceMetricsWidget(
                          metrics: data['performanceMetrics'],
                        ),

                        const SizedBox(height: 24),

                        // Weekly earnings details
                        WeeklyEarningsWidget(earnings: data['weeklyEarnings']),

                        const SizedBox(
                          height: 100,
                        ), // Bottom padding for navigation
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          // TabBar Navigation
          _buildBottomNavigation(),
        ],
      ),
    );
  }

  Widget _buildBottomNavigation() {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.lightTheme.colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: TabBar(
        controller: _tabController,
        onTap: (index) {
          switch (index) {
            case 0:
              Navigator.pushReplacementNamed(
                  context, AppRoutes.instructorAgenda);
              break;
            case 1:
              // Already on overview screen
              break;
            case 2:
              Navigator.pushReplacementNamed(
                  context, AppRoutes.instructorStudentManagement);
              break;
          }
        },
        tabs: [
          Tab(
            icon: CustomIconWidget(
              iconName: 'calendar_today',
              color: AppTheme.lightTheme.colorScheme.onSurfaceVariant,
              size: 24,
            ),
            text: 'Agenda',
          ),
          Tab(
            icon: CustomIconWidget(
              iconName: 'dashboard',
              color: AppTheme.lightTheme.colorScheme.primary,
              size: 24,
            ),
            text: 'Overzicht',
          ),
          Tab(
            icon: CustomIconWidget(
              iconName: 'people',
              color: AppTheme.lightTheme.colorScheme.onSurfaceVariant,
              size: 24,
            ),
            text: 'Leerlingen',
          ),
        ],
      ),
    );
  }

  Future<Map<String, dynamic>> _loadOverviewData() async {
    // Simulate loading delay
    await Future.delayed(const Duration(milliseconds: 800));

    // Get all lessons from service
    final lessons = _lessonsService.lessons;
    final now = DateTime.now();

    // Find next appointment
    Map<String, dynamic>? nextAppointment;
    DateTime? earliestDate;

    for (final entry in lessons.entries) {
      if (entry.key.isAfter(now.subtract(const Duration(days: 1)))) {
        for (final lesson in entry.value) {
          if (lesson['studentName'] != null) {
            final lessonDateTime = DateTime(
              entry.key.year,
              entry.key.month,
              entry.key.day,
              int.parse(lesson['startTime'].split(':')[0]),
              int.parse(lesson['startTime'].split(':')[1]),
            );

            if (lessonDateTime.isAfter(now) &&
                (earliestDate == null ||
                    lessonDateTime.isBefore(earliestDate))) {
              earliestDate = lessonDateTime;
              nextAppointment = {...lesson, 'date': entry.key};
            }
          }
        }
      }
    }

    // Calculate student activity (mock data for categorization)
    final studentActivity = _calculateStudentActivity(lessons);

    // Mock weekly earnings data
    final weeklyEarnings = {
      'currentWeek': 1250.00,
      'trend': 8.5, // percentage increase/decrease
      'lessonsThisWeek': 28,
      'hoursThisWeek': 42.0,
    };

    // Mock performance metrics
    final performanceMetrics = {
      'completionRate': 96.5,
      'studentSatisfaction': 4.8,
      'averageLessonDuration': 52.5,
    };

    return {
      'nextAppointment': nextAppointment,
      'studentActivity': studentActivity,
      'weeklyEarnings': weeklyEarnings,
      'performanceMetrics': performanceMetrics,
    };
  }

  Map<String, dynamic> _calculateStudentActivity(
    Map<DateTime, List<Map<String, dynamic>>> lessons,
  ) {
    final now = DateTime.now();
    final oneMonthAgo = now.subtract(const Duration(days: 30));
    final threeWeeksFromNow = now.add(const Duration(days: 21));
    final fourWeeksFromNow = now.add(const Duration(days: 28));

    // Mock student data for calculation
    final studentStats = <String, Map<String, dynamic>>{
      'Emma van der Berg': {
        'pastLessons': 4,
        'futureLessons': 3,
        'lastLesson': now.subtract(const Duration(days: 5)),
      },
      'Lucas Janssen': {
        'pastLessons': 5,
        'futureLessons': 2,
        'lastLesson': now.subtract(const Duration(days: 3)),
      },
      'Sophie de Wit': {
        'pastLessons': 8,
        'futureLessons': 4,
        'lastLesson': now.subtract(const Duration(days: 2)),
      },
      'Daan Bakker': {
        'pastLessons': 2,
        'futureLessons': 1,
        'lastLesson': now.subtract(const Duration(days: 12)),
      },
      'Mila Hendriks': {
        'pastLessons': 3,
        'futureLessons': 2,
        'lastLesson': now.subtract(const Duration(days: 7)),
      },
      'Liam de Jong': {
        'pastLessons': 1,
        'futureLessons': 0,
        'lastLesson': now.subtract(const Duration(days: 45)),
      },
      'Zoe Visser': {
        'pastLessons': 0,
        'futureLessons': 0,
        'lastLesson': now.subtract(const Duration(days: 60)),
      },
    };

    final activeStudents = <Map<String, dynamic>>[];
    final irregularStudents = <Map<String, dynamic>>[];
    final nonActiveStudents = <Map<String, dynamic>>[];

    for (final entry in studentStats.entries) {
      final name = entry.key;
      final stats = entry.value;
      final pastLessons = stats['pastLessons'] as int;
      final futureLessons = stats['futureLessons'] as int;
      final lastLesson = stats['lastLesson'] as DateTime;

      final daysSinceLastLesson = now.difference(lastLesson).inDays;

      final studentData = {
        'name': name,
        'pastLessons': pastLessons,
        'futureLessons': futureLessons,
        'daysSinceLastLesson': daysSinceLastLesson,
        'profileImage':
            'https://images.unsplash.com/photo-1494790108755-2616b2e8c7c3?w=150&h=150&fit=crop&crop=face',
      };

      // Categorize students based on criteria
      if (pastLessons >= 3 && futureLessons >= 2) {
        activeStudents.add(studentData);
      } else if (pastLessons <= 2 && futureLessons == 1) {
        irregularStudents.add(studentData);
      } else if (daysSinceLastLesson >= 30 && futureLessons == 0) {
        nonActiveStudents.add(studentData);
      } else {
        // Default to irregular for edge cases
        irregularStudents.add(studentData);
      }
    }

    return {
      'activeStudents': activeStudents,
      'irregularStudents': irregularStudents,
      'nonActiveStudents': nonActiveStudents,
    };
  }

  Widget _buildLoadingSkeleton(bool isDark) {
    final shimmerColor = isDark
        ? AppTheme.borderDark.withValues(alpha: 0.3)
        : AppTheme.borderLight.withValues(alpha: 0.3);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Header skeleton
          Container(
            width: double.infinity,
            height: 120,
            decoration: BoxDecoration(
              color: shimmerColor,
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          const SizedBox(height: 24),

          // Next appointment skeleton
          Container(
            width: double.infinity,
            height: 100,
            decoration: BoxDecoration(
              color: shimmerColor,
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          const SizedBox(height: 24),

          // Student activity skeleton
          Container(
            width: double.infinity,
            height: 400,
            decoration: BoxDecoration(
              color: shimmerColor,
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: Theme.of(context).colorScheme.error,
          ),
          const SizedBox(height: 16),
          Text(
            'Er is een fout opgetreden',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'Probeer het opnieuw',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _overviewDataFuture = _loadOverviewData();
              });
            },
            child: const Text('Opnieuw proberen'),
          ),
        ],
      ),
    );
  }
}
