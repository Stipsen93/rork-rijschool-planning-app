import 'package:flutter/material.dart';
import 'package:sizer/sizer.dart';

import '../../core/app_export.dart';
import '../../services/supabase_service.dart';
import './widgets/empty_state_widget.dart';
import './widgets/loading_skeleton.dart';
import './widgets/student_card.dart';
import './widgets/student_filter_bottom_sheet.dart';
import './widgets/student_search_bar.dart';

class InstructorStudentManagement extends StatefulWidget {
  const InstructorStudentManagement({Key? key}) : super(key: key);

  @override
  State<InstructorStudentManagement> createState() =>
      _InstructorStudentManagementState();
}

class _InstructorStudentManagementState
    extends State<InstructorStudentManagement> with TickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  late TabController _bottomTabController;

  bool _isLoading = true;
  List<Map<String, dynamic>> _allStudents = [];
  List<Map<String, dynamic>> _filteredStudents = [];
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _bottomTabController = TabController(length: 3, vsync: this);
    _loadStudents();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _bottomTabController.dispose();
    super.dispose();
  }

  Future<void> _loadStudents() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final currentUser = SupabaseService.instance.client.auth.currentUser;
      if (currentUser != null) {
        final students = await SupabaseService.instance.getStudents(
          instructorId: currentUser.id,
        );

        setState(() {
          _allStudents = students;
          _filteredStudents = students;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      // Handle error - you might want to show a snackbar or error message
    }
  }

  void _filterStudents() {
    List<Map<String, dynamic>> filtered = _allStudents;

    // Apply search filter
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((student) {
        final userProfile = student['user_profiles'] as Map<String, dynamic>?;
        final fullName =
            userProfile?['full_name']?.toString().toLowerCase() ?? '';
        final email = userProfile?['email']?.toString().toLowerCase() ?? '';
        final query = _searchQuery.toLowerCase();

        return fullName.contains(query) || email.contains(query);
      }).toList();
    }

    setState(() {
      _filteredStudents = filtered;
    });
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
    });
    _filterStudents();
  }

  void _showFilterBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StudentFilterBottomSheet(
        selectedFilter: 'Alle',
        onFilterChanged: (filter) {
          // No filter changes needed since tabs are removed
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Column(
        children: [
          // AppBar content
          Container(
            padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
            color: Theme.of(context).scaffoldBackgroundColor,
            child: Column(
              children: [
                Container(
                  height: kToolbarHeight,
                  padding: EdgeInsets.symmetric(horizontal: 4.w),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: CustomIconWidget(
                          iconName: 'arrow_back',
                          color:
                              Theme.of(context).textTheme.titleLarge?.color ??
                                  Colors.black,
                          size: 24,
                        ),
                      ),
                      Expanded(
                        child: Text(
                          'Leerlingenbeheer',
                          style:
                              Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                        ),
                      ),
                      IconButton(
                        onPressed: _showFilterBottomSheet,
                        icon: CustomIconWidget(
                          iconName: 'filter_list',
                          color:
                              Theme.of(context).textTheme.titleLarge?.color ??
                                  Colors.black,
                          size: 24,
                        ),
                      ),
                      IconButton(
                        onPressed: _loadStudents,
                        icon: CustomIconWidget(
                          iconName: 'refresh',
                          color:
                              Theme.of(context).textTheme.titleLarge?.color ??
                                  Colors.black,
                          size: 24,
                        ),
                      ),
                    ],
                  ),
                ),
                // Add new student button - moved higher
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.h),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pushNamed(
                                context, AppRoutes.addNewStudentScreen)
                            .then((_) =>
                                _loadStudents()); // Refresh list when returning
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).primaryColor,
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.symmetric(vertical: 2.h),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      icon: CustomIconWidget(
                        iconName: 'person_add',
                        color: Colors.white,
                        size: 5.w,
                      ),
                      label: Text(
                        'Nieuwe Leerling',
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ),
                  ),
                ),
                // Search Bar only (removed tabs)
                if (_allStudents.isNotEmpty)
                  Padding(
                    padding:
                        EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.h),
                    child: StudentSearchBar(
                      searchQuery: _searchQuery,
                      onSearchChanged: _onSearchChanged,
                      onFilterTap: _showFilterBottomSheet,
                      activeFilter: 'Alle',
                    ),
                  ),
              ],
            ),
          ),
          // Body content
          Expanded(child: _buildBody()),
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
        controller: _bottomTabController,
        onTap: (index) {
          switch (index) {
            case 0:
              Navigator.pushReplacementNamed(
                  context, AppRoutes.instructorAgenda);
              break;
            case 1:
              Navigator.pushReplacementNamed(
                  context, AppRoutes.instructorOverviewScreen);
              break;
            case 2:
              // Already on student management screen
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
              color: AppTheme.lightTheme.colorScheme.onSurfaceVariant,
              size: 24,
            ),
            text: 'Overzicht',
          ),
          Tab(
            icon: CustomIconWidget(
              iconName: 'people',
              color: AppTheme.lightTheme.colorScheme.primary,
              size: 24,
            ),
            text: 'Leerlingen',
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const LoadingSkeleton();
    }

    if (_filteredStudents.isEmpty) {
      return const EmptyStateWidget(
        filter: 'all',
        searchQuery: '',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadStudents,
      child: ListView.builder(
        padding: EdgeInsets.all(4.w),
        itemCount: _filteredStudents.length,
        itemBuilder: (context, index) {
          final student = _filteredStudents[index];
          return Padding(
            padding: EdgeInsets.only(bottom: 2.h),
            child: StudentCard(
              student: student,
              onTap: () => _navigateToStudentProfile(student),
              onScheduleLesson: () => _editStudent(student),
              onSendMessage: () => _editStudent(student),
              onViewProgress: () => _editStudent(student),
              onRemoveStudent: () => _deleteStudent(student),
            ),
          );
        },
      ),
    );
  }

  void _navigateToStudentProfile(Map<String, dynamic> student) {
    Navigator.pushNamed(
      context,
      AppRoutes.studentProfileOverview,
      arguments: student,
    );
  }

  void _editStudent(Map<String, dynamic> student) {
    // Navigate to edit student screen
    // You can implement this based on your requirements
  }

  Future<void> _deleteStudent(Map<String, dynamic> student) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Leerling Verwijderen'),
        content: Text(
          'Weet je zeker dat je ${student['user_profiles']?['full_name'] ?? 'deze leerling'} wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Annuleren'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: Text('Verwijderen'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await SupabaseService.instance.deleteStudent(student['id']);
        _loadStudents(); // Refresh the list
      } catch (e) {
        // Show error message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Fout bij het verwijderen van de leerling'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }
}
