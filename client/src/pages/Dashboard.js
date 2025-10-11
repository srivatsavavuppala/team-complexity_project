import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Work as WorkIcon,
  RecordVoiceOver as InterviewIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { motion } from 'framer-motion';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const StatCard = ({ title, value, icon, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
              {value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +{trend}% this month
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  </motion.div>
);

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading } = useQuery(
    'dashboard-stats',
    () => axios.get('/api/dashboard/stats').then(res => res.data.stats)
  );

  const { data: activity, isLoading: activityLoading } = useQuery(
    'dashboard-activity',
    () => axios.get('/api/dashboard/activity').then(res => res.data.activities)
  );

  const { data: trends, isLoading: trendsLoading } = useQuery(
    'dashboard-trends',
    () => axios.get('/api/dashboard/trends/interviews?days=30').then(res => res.data.trends)
  );

  const { data: pipeline, isLoading: pipelineLoading } = useQuery(
    'dashboard-pipeline',
    () => axios.get('/api/dashboard/pipeline').then(res => res.data.pipeline)
  );

  if (statsLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const interviewStatusData = stats?.interviewsByStatus ? [
    { name: 'Scheduled', value: stats.interviewsByStatus.scheduled || 0, color: '#2196f3' },
    { name: 'In Progress', value: stats.interviewsByStatus.in_progress || 0, color: '#ff9800' },
    { name: 'Completed', value: stats.interviewsByStatus.completed || 0, color: '#4caf50' },
  ] : [];

  const experienceData = pipeline?.candidatesByExperience || [];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Candidates"
            value={stats?.totalCandidates || 0}
            icon={<PeopleIcon />}
            color="primary"
            trend={stats?.recentCandidates ? Math.round((stats.recentCandidates / stats.totalCandidates) * 100) : 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Job Positions"
            value={stats?.totalJobs || 0}
            icon={<WorkIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Interviews"
            value={stats?.totalInterviews || 0}
            icon={<InterviewIcon />}
            color="success"
            trend={stats?.recentInterviews ? Math.round((stats.recentInterviews / stats.totalInterviews) * 100) : 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Score"
            value={stats?.averageInterviewScore || 0}
            icon={<TrendingUpIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Interview Trends Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Interview Trends (Last 30 Days)
              </Typography>
              {trendsLoading ? (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LinearProgress sx={{ width: '50%' }} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="totalInterviews" 
                      stroke="#2196f3" 
                      strokeWidth={2}
                      name="Total Interviews"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completedInterviews" 
                      stroke="#4caf50" 
                      strokeWidth={2}
                      name="Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Interview Status Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Interview Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={interviewStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {interviewStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                {interviewStatusData.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        bgcolor: item.color,
                        borderRadius: '50%',
                        mr: 1,
                      }}
                    />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Candidates by Experience */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Candidates by Experience Level
              </Typography>
              {pipelineLoading ? (
                <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LinearProgress sx={{ width: '50%' }} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={experienceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="level" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2196f3" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Recent Activity
              </Typography>
              {activityLoading ? (
                <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LinearProgress sx={{ width: '50%' }} />
                </Box>
              ) : (
                <List sx={{ maxHeight: 250, overflow: 'auto' }}>
                  {activity?.slice(0, 8).map((item, index) => (
                    <ListItem key={index} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getActivityColor(item.type) }}>
                          {getActivityIcon(item.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.title}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={item.type}
                              size="small"
                              variant="outlined"
                              sx={{ textTransform: 'capitalize' }}
                            />
                            <Typography variant="caption">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Skills */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Top Skills in Candidate Pool
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {stats?.topSkills?.slice(0, 15).map((skill, index) => (
                  <Chip
                    key={index}
                    label={`${skill.skill} (${skill.count})`}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      bgcolor: `hsl(${(index * 137.5) % 360}, 70%, 95%)`,
                      borderColor: `hsl(${(index * 137.5) % 360}, 70%, 70%)`,
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

const getActivityColor = (type) => {
  switch (type) {
    case 'candidate': return 'primary.main';
    case 'job': return 'secondary.main';
    case 'interview': return 'success.main';
    default: return 'grey.500';
  }
};

const getActivityIcon = (type) => {
  switch (type) {
    case 'candidate': return <PersonIcon />;
    case 'job': return <BusinessIcon />;
    case 'interview': return <InterviewIcon />;
    default: return <PersonIcon />;
  }
};

export default Dashboard;