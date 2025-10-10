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

const StatCard = ({ title, value, icon, color, trend, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    whileHover={{ y: -4 }}
  >
    <Card sx={{ 
      height: '100%', 
      position: 'relative', 
      overflow: 'visible',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      border: '1px solid',
      borderColor: 'grey.100',
      '&:hover': {
        borderColor: `${color}.light`,
        boxShadow: `0 10px 25px -5px rgba(37, 99, 235, 0.1), 0 4px 6px -2px rgba(37, 99, 235, 0.05)`,
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              color="text.secondary" 
              gutterBottom 
              variant="overline" 
              sx={{ fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.5px' }}
            >
              {title}
            </Typography>
            <Typography variant="h3" component="div" sx={{ 
              fontWeight: 700, 
              color: 'text.primary',
              mb: 0.5,
              lineHeight: 1.2
            }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                  +{trend}% this month
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Box sx={{
              position: 'absolute',
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${color === 'primary' ? '#2563eb' : color === 'secondary' ? '#7c3aed' : color === 'success' ? '#059669' : '#d97706'} 0%, ${color === 'primary' ? '#60a5fa' : color === 'secondary' ? '#a78bfa' : color === 'success' ? '#34d399' : '#fbbf24'} 100%)`,
              opacity: 0.1,
            }} />
            <Avatar
              sx={{
                background: `linear-gradient(135deg, ${color === 'primary' ? '#2563eb' : color === 'secondary' ? '#7c3aed' : color === 'success' ? '#059669' : '#d97706'} 0%, ${color === 'primary' ? '#60a5fa' : color === 'secondary' ? '#a78bfa' : color === 'success' ? '#34d399' : '#fbbf24'} 100%)`,
                width: 64,
                height: 64,
                boxShadow: `0 8px 16px -4px ${color === 'primary' ? 'rgba(37, 99, 235, 0.3)' : color === 'secondary' ? 'rgba(124, 58, 237, 0.3)' : color === 'success' ? 'rgba(5, 150, 105, 0.3)' : 'rgba(217, 119, 6, 0.3)'}`,
              }}
            >
              {icon}
            </Avatar>
          </Box>
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
    <Box sx={{ width: '100%' }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" component="h1" sx={{ 
          fontWeight: 700, 
          color: 'text.primary',
          mb: 1,
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Welcome back! Here's what's happening with your recruitment process today.
        </Typography>
        
        {/* Quick Actions */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label="📊 View Analytics" 
            variant="outlined" 
            color="primary"
            sx={{ fontWeight: 500 }}
          />
          <Chip 
            label="👥 Add Candidate" 
            variant="outlined" 
            color="secondary"
            sx={{ fontWeight: 500 }}
          />
          <Chip 
            label="💼 Post Job" 
            variant="outlined" 
            color="success"
            sx={{ fontWeight: 500 }}
          />
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Candidates"
            value={stats?.totalCandidates || 0}
            subtitle="Active in pipeline"
            icon={<PeopleIcon />}
            color="primary"
            trend={stats?.recentCandidates ? Math.round((stats.recentCandidates / stats.totalCandidates) * 100) : 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Job Positions"
            value={stats?.totalJobs || 0}
            subtitle="Open positions"
            icon={<WorkIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Interviews"
            value={stats?.totalInterviews || 0}
            subtitle="This month"
            icon={<InterviewIcon />}
            color="success"
            trend={stats?.recentInterviews ? Math.round((stats.recentInterviews / stats.totalInterviews) * 100) : 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Avg Score"
            value={`${stats?.averageInterviewScore || 0}%`}
            subtitle="Interview success rate"
            icon={<TrendingUpIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Interview Trends Chart */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid',
              borderColor: 'grey.100',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                      Interview Trends
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Performance over the last 30 days
                    </Typography>
                  </Box>
                  <Chip 
                    label="Last 30 Days" 
                    size="small" 
                    variant="outlined"
                    color="primary"
                    sx={{ fontWeight: 500 }}
                  />
                </Box>
                {trendsLoading ? (
                  <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LinearProgress sx={{ width: '50%' }} />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={trends || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalInterviews" 
                        stroke="#2563eb" 
                        strokeWidth={3}
                        name="Total Interviews"
                        dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="completedInterviews" 
                        stroke="#059669" 
                        strokeWidth={3}
                        name="Completed"
                        dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#059669', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Interview Status Distribution */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid',
              borderColor: 'grey.100',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                    Interview Status
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current distribution
                  </Typography>
                </Box>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={interviewStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {interviewStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ mt: 2 }}>
                  {interviewStatusData.map((item, index) => (
                    <Box key={index} sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 1.5,
                      p: 1.5,
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'grey.100'
                    }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          bgcolor: item.color,
                          borderRadius: '50%',
                          mr: 1.5,
                        }}
                      />
                      <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 500 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Candidates by Experience */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid',
              borderColor: 'grey.100',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                    Experience Levels
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Candidate distribution by experience
                  </Typography>
                </Box>
                {pipelineLoading ? (
                  <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LinearProgress sx={{ width: '50%' }} />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={experienceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="level" 
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="url(#colorGradient)"
                        radius={[4, 4, 0, 0]}
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.7}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid',
              borderColor: 'grey.100',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                    Recent Activity
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Latest updates and actions
                  </Typography>
                </Box>
                {activityLoading ? (
                  <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LinearProgress sx={{ width: '50%' }} />
                  </Box>
                ) : (
                  <List sx={{ maxHeight: 280, overflow: 'auto', px: 0 }}>
                    {activity?.slice(0, 6).map((item, index) => (
                      <ListItem 
                        key={index} 
                        sx={{ 
                          px: 0, 
                          py: 1.5,
                          borderBottom: index !== activity.slice(0, 6).length - 1 ? '1px solid' : 'none',
                          borderColor: 'grey.100'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: getActivityColor(item.type),
                            width: 40,
                            height: 40,
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                          }}>
                            {getActivityIcon(item.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {item.title}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip
                                label={item.type}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  textTransform: 'capitalize',
                                  height: 20,
                                  fontSize: '0.7rem',
                                  fontWeight: 500
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
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
          </motion.div>
        </Grid>

        {/* Top Skills */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card sx={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid',
              borderColor: 'grey.100',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                    Top Skills in Candidate Pool
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Most in-demand skills across all candidates
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {stats?.topSkills?.slice(0, 20).map((skill, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Chip
                        label={`${skill.skill} (${skill.count})`}
                        variant="outlined"
                        sx={{ 
                          bgcolor: `hsl(${(index * 137.5) % 360}, 70%, 96%)`,
                          borderColor: `hsl(${(index * 137.5) % 360}, 70%, 80%)`,
                          color: `hsl(${(index * 137.5) % 360}, 70%, 25%)`,
                          fontWeight: 500,
                          fontSize: '0.85rem',
                          height: 32,
                          '&:hover': {
                            bgcolor: `hsl(${(index * 137.5) % 360}, 70%, 92%)`,
                            borderColor: `hsl(${(index * 137.5) % 360}, 70%, 60%)`,
                            transform: 'translateY(-1px)',
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      />
                    </motion.div>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
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