import 'package:flutter/material.dart';
import 'package:sizer/sizer.dart';

import '../../core/app_export.dart';
import '../../services/lessons_service.dart';
import '../instructor_agenda_screen/widgets/agenda_header_widget.dart';
import '../instructor_agenda_screen/widgets/day_strip_widget.dart';
import '../instructor_agenda_screen/widgets/lesson_card_widget.dart';
import '../instructor_agenda_screen/widgets/lesson_detail_sheet_widget.dart';
import '../instructor_agenda_screen/widgets/monthly_view_widget.dart';

class InstructorAgendaScreen extends StatefulWidget {
  const InstructorAgendaScreen({Key? key}) : super(key: key);

  @override
  State<InstructorAgendaScreen> createState() => _InstructorAgendaScreenState();
}

class _InstructorAgendaScreenState extends State<InstructorAgendaScreen>
    with TickerProviderStateMixin {
  DateTime _currentDate = DateTime.now();
  DateTime _selectedDate = DateTime.now();
  bool _showMonthlyView = false;
  bool _isLoading = false;

  final _lessonsService = LessonsService();

  // Lessons data from service
  Map<DateTime, List<Map<String, dynamic>>> _lessons = {};

  @override
  void initState() {
    super.initState();
    _currentDate = _getStartOfWeek(DateTime.now());

    // Initialize lessons data
    _lessons = _lessonsService.lessons;

    // Listen to lessons updates
    _lessonsService.lessonsStream.listen((updatedLessons) {
      if (mounted) {
        setState(() {
          _lessons = updatedLessons;
        });
      }
    });
  }

  DateTime _getStartOfWeek(DateTime date) {
    return date.subtract(Duration(days: date.weekday - 1));
  }

  Map<DateTime, int> _getLessonCounts() {
    return _lessonsService.getLessonCounts();
  }

  List<Map<String, dynamic>> _getLessonsForDate(DateTime date) {
    return _lessonsService.getLessonsForDate(date);
  }

  Future<void> _refreshData() async {
    setState(() => _isLoading = true);

    // Simulate API call - in real implementation, refresh from backend
    await Future.delayed(const Duration(seconds: 1));

    // Update lessons from service
    setState(() {
      _lessons = _lessonsService.lessons;
      _isLoading = false;
    });
  }

  void _onDateSelected(DateTime date) {
    setState(() {
      _selectedDate = date;
    });
  }

  void _showCalendarOverlay() {
    setState(() => _showMonthlyView = true);
  }

  void _showLessonDetails(Map<String, dynamic> lesson) {
    if (lesson['studentName'] == null) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => LessonDetailSheetWidget(
        lesson: lesson,
        onReschedule: () {
          Navigator.pop(context);
          _showRescheduleDialog(lesson);
        },
        onCancel: () {
          Navigator.pop(context);
          _showCancelDialog(lesson);
        },
        onMarkComplete: () {
          Navigator.pop(context);
          _markLessonComplete(lesson);
        },
        onAddNotes: () {
          Navigator.pop(context);
          _showAddNotesDialog(lesson);
        },
      ),
    );
  }

  void _showRescheduleDialog(Map<String, dynamic> lesson) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Les verplaatsen'),
        content:
            Text('Wilt u de les van ${lesson['studentName']} verplaatsen?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuleren'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Handle reschedule logic
            },
            child: const Text('Verplaatsen'),
          ),
        ],
      ),
    );
  }

  void _showCancelDialog(Map<String, dynamic> lesson) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Les annuleren'),
        content: Text('Wilt u de les van ${lesson['studentName']} annuleren?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Nee'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Handle cancel logic
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.lightTheme.colorScheme.error,
            ),
            child: const Text('Annuleren'),
          ),
        ],
      ),
    );
  }

  void _markLessonComplete(Map<String, dynamic> lesson) {
    // Handle mark complete logic
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content:
            Text('Les van ${lesson['studentName']} gemarkeerd als voltooid'),
        backgroundColor: AppTheme.lightTheme.colorScheme.tertiary,
      ),
    );
  }

  void _showAddNotesDialog(Map<String, dynamic> lesson) {
    final TextEditingController notesController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Notitie toevoegen'),
        content: TextField(
          controller: notesController,
          maxLines: 3,
          decoration: const InputDecoration(
            hintText: 'Voeg een notitie toe...',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuleren'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Handle add notes logic
            },
            child: const Text('Opslaan'),
          ),
        ],
      ),
    );
  }

  void _showAddLessonDialog() async {
    final result = await Navigator.pushNamed(
      context,
      AppRoutes.addLessonScreen,
      arguments: _selectedDate,
    );

    // Refresh data when returning from add lesson screen
    if (result == true || result == null) {
      _refreshData();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.lightTheme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            if (!_showMonthlyView) ...[
              AgendaHeaderWidget(
                currentDate: _currentDate,
                onPreviousWeek: () {
                  setState(() {
                    _currentDate =
                        _currentDate.subtract(const Duration(days: 7));
                  });
                },
                onNextWeek: () {
                  setState(() {
                    _currentDate = _currentDate.add(const Duration(days: 7));
                  });
                },
                onMonthlyView: _showCalendarOverlay,
              ),
              DayStripWidget(
                currentWeekStart: _getStartOfWeek(_currentDate),
                selectedDate: _selectedDate,
                onDateSelected: _onDateSelected,
                lessonCounts: _getLessonCounts(),
              ),
            ],
            Expanded(
              child:
                  _showMonthlyView ? _buildMonthlyView() : _buildWeeklyView(),
            ),
            _buildBottomNavigation(),
          ],
        ),
      ),
      floatingActionButton: !_showMonthlyView
          ? FloatingActionButton(
              heroTag: "add_lesson",
              onPressed: _showAddLessonDialog,
              child: CustomIconWidget(
                iconName: 'add',
                color: Colors.white,
                size: 24,
              ),
            )
          : null,
    );
  }

  Widget _buildWeeklyView() {
    final lessons = _getLessonsForDate(_selectedDate);

    return RefreshIndicator(
      onRefresh: _refreshData,
      child: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: EdgeInsets.symmetric(vertical: 2.h),
              itemCount: lessons.length,
              itemBuilder: (context, index) {
                final lesson = lessons[index];
                return LessonCardWidget(
                  lesson: lesson,
                  onTap: () => _showLessonDetails(lesson),
                  onEdit: () => _showRescheduleDialog(lesson),
                  onCancel: () => _showCancelDialog(lesson),
                  onDelete: () => _markLessonComplete(lesson),
                );
              },
            ),
    );
  }

  Widget _buildMonthlyView() {
    return MonthlyViewWidget(
      focusedDay: _currentDate,
      selectedDay: _selectedDate,
      onDaySelected: (selectedDay, focusedDay) {
        setState(() {
          _selectedDate = selectedDay;
          _currentDate = focusedDay;
          _showMonthlyView = false;
        });
      },
      lessons: _lessons,
      onClose: () {
        setState(() => _showMonthlyView = false);
      },
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
      child: Row(
        children: [
          Expanded(
            child: InkWell(
              onTap: () {
                // Stay on current agenda screen - no navigation needed
              },
              child: Container(
                padding: EdgeInsets.symmetric(vertical: 12.sp),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CustomIconWidget(
                      iconName: 'calendar_today',
                      color: AppTheme.lightTheme.colorScheme.primary,
                      size: 24,
                    ),
                    SizedBox(height: 4.sp),
                    Text(
                      'Agenda',
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: AppTheme.lightTheme.colorScheme.primary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: InkWell(
              onTap: () {
                Navigator.pushNamed(
                    context, AppRoutes.instructorOverviewScreen);
              },
              child: Container(
                padding: EdgeInsets.symmetric(vertical: 12.sp),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CustomIconWidget(
                      iconName: 'dashboard',
                      color: AppTheme.lightTheme.colorScheme.onSurfaceVariant,
                      size: 24,
                    ),
                    SizedBox(height: 4.sp),
                    Text(
                      'Overzicht',
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: AppTheme.lightTheme.colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: InkWell(
              onTap: () {
                Navigator.pushNamed(
                    context, AppRoutes.instructorStudentManagement);
              },
              child: Container(
                padding: EdgeInsets.symmetric(vertical: 12.sp),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CustomIconWidget(
                      iconName: 'people',
                      color: AppTheme.lightTheme.colorScheme.onSurfaceVariant,
                      size: 24,
                    ),
                    SizedBox(height: 4.sp),
                    Text(
                      'Leerlingen',
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: AppTheme.lightTheme.colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
