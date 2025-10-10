import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Badge,
  Chip,
  Stack,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  RecordVoiceOver as InterviewIcon,
  AccountCircle,
  Logout,
  Settings,
  Notifications,
  Search,
  Psychology,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 300;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', badge: null },
  { text: 'Candidates', icon: <PeopleIcon />, path: '/candidates', badge: null },
  { text: 'Job Positions', icon: <WorkIcon />, path: '/jobs', badge: null },
  { text: 'Interviews', icon: <InterviewIcon />, path: '/interviews', badge: '3' },
];

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 48,
              height: 48,
              fontSize: '1.4rem',
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            }}
          >
            <Psychology />
          </Avatar>
          <Box>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: 'text.primary' }}>
              AI Recruiter
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Enterprise Platform
            </Typography>
          </Box>
        </Box>
        <Chip 
          label="Pro Plan" 
          size="small" 
          color="primary" 
          variant="outlined"
          sx={{ fontSize: '0.75rem' }}
        />
      </Box>

      <Divider sx={{ mx: 2 }} />

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, px: 2, py: 1 }}>
        <Typography variant="overline" sx={{ px: 2, py: 1, color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600 }}>
          MAIN MENU
        </Typography>
        <List sx={{ px: 0 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) {
                    setMobileOpen(false);
                  }
                }}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  px: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    transform: 'translateX(4px)',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                    '& .MuiListItemText-primary': {
                      fontWeight: 600,
                    },
                  },
                  '&:hover': {
                    bgcolor: 'grey.50',
                    transform: 'translateX(2px)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontWeight: location.pathname === item.path ? 600 : 500,
                    fontSize: '0.95rem'
                  }} 
                />
                {item.badge && (
                  <Chip 
                    label={item.badge} 
                    size="small" 
                    color="error" 
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem',
                      '& .MuiChip-label': { px: 1 }
                    }} 
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* User Info Section */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Box sx={{ 
          bgcolor: 'grey.50', 
          borderRadius: 3, 
          p: 2,
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }} noWrap>
                {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        elevation={0}
      >
        <Toolbar sx={{ py: 1 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Search Bar */}
          <Box sx={{ 
            display: { xs: 'none', sm: 'flex' }, 
            alignItems: 'center', 
            bgcolor: 'grey.50', 
            borderRadius: 3, 
            px: 2, 
            py: 1, 
            minWidth: 300,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <Search sx={{ color: 'text.secondary', mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Search candidates, jobs, interviews...
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Header Actions */}
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              size="large"
              aria-label="notifications"
              color="inherit"
              sx={{ 
                bgcolor: 'grey.50', 
                border: '1px solid',
                borderColor: 'grey.200',
                '&:hover': { bgcolor: 'grey.100' }
              }}
            >
              <Badge badgeContent={4} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              bgcolor: 'grey.50', 
              borderRadius: 3, 
              px: 2, 
              py: 1,
              border: '1px solid',
              borderColor: 'grey.200',
              cursor: 'pointer'
            }}
            onClick={handleProfileMenuOpen}
            >
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Administrator
                </Typography>
              </Box>
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </Box>
          </Stack>
        </Toolbar>
      </AppBar>

      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            minWidth: 200,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#ffffff',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '80px',
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 80px)',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: '100%' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;