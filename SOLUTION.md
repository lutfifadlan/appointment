# Appointment Editing Locking Mechanism Implementation

## Overview

This document describes the implementation of the appointment editing locking mechanism in the frontend application. The locking mechanism prevents concurrent edits on an appointment, allowing only one user to edit at a time while others can only view.

## Architecture

The implementation follows a client-server architecture with real-time updates via WebSockets:

1. **Backend**: Node.js/Express server with REST endpoints and WebSocket connections for real-time updates
2. **Frontend**: React/Next.js application with context-based state management

## Components

### 1. Lock Context (`LockContext.tsx`)

The `LockContext` provides a centralized state management for lock-related functionality:

- **State Management**: Tracks lock status, ownership, and error states
- **API Integration**: Connects to backend lock endpoints
- **WebSocket Integration**: Establishes real-time connection for lock updates
- **Auto-refresh**: Automatically refreshes locks to prevent expiration
- **Cleanup**: Releases locks on component unmount or tab close

### 2. Appointment Editor (`AppointmentEditor.tsx`)

The main component for editing appointments with lock awareness:

- **Lock Visualization**: Shows visual indicators for lock status
- **Form Control**: Disables inputs when not the lock owner
- **Lock Controls**: Provides buttons to acquire/release locks
- **Admin Takeover**: Special functionality for admins to force release locks
- **Collaborative Cursors**: Shows other users' cursors in real-time

### 3. Following Pointer (`FollowingPointer.tsx`)

A component for displaying other users' cursors:

- **Animated Cursors**: Smooth animations for cursor movements
- **User Identification**: Shows the name of the user controlling the cursor
- **Visual Distinction**: Different colors for lock owner vs. other users

## Features

### 1. Lock Awareness

- Visual indicators show when an appointment is locked
- Displays the current editor's identity
- Shows a countdown timer for lock expiration

### 2. Real-Time Updates

- WebSocket connection for immediate lock status changes
- Loading states during lock acquisition/release
- Collaborative cursors showing other users' positions

### 3. Takeover Feature

- "Request Control" button for normal users
- "Force Take Control" button for admins
- Graceful handling of takeover conflicts

### 4. Concurrency Control

- Optimistic locking for data integrity
- Handles race conditions in lock acquisition
- Proper error handling for lock conflicts

### 5. Security

- User permission validation for lock operations
- WebSocket message sanitization
- Automatic lock release on page unload

## Implementation Details

### Lock Lifecycle

1. **Acquisition**: User requests a lock through the UI
2. **Validation**: Backend checks if appointment is already locked
3. **Granting**: If available, lock is granted and stored with expiry time
4. **Notification**: All connected clients are notified via WebSocket
5. **Maintenance**: Active locks are refreshed automatically every 4 minutes
6. **Release**: User explicitly releases lock or it expires after 5 minutes of inactivity

### WebSocket Events

- `lock-update`: General lock status updates
- `lock-acquired`: Notification when a lock is acquired
- `lock-released`: Notification when a lock is released
- `admin-takeover`: Notification when an admin forces a lock release
- `cursor-update`: Real-time cursor position updates

## Usage

To use the locking mechanism in a component:

```tsx
import { useLock } from '../lib/contexts/LockContext';

function MyComponent() {
  const {
    isLocked,
    isCurrentUserLockOwner,
    acquireLock,
    releaseLock
  } = useLock();
  
  // Component logic using lock state and functions
}
```

## Future Improvements

1. **Conflict Resolution**: Enhanced UI for handling edit conflicts
2. **Offline Support**: Better handling of network disconnections
3. **Lock History**: Audit trail of lock acquisitions and releases
4. **Partial Locking**: Section-based locking for collaborative editing
5. **Presence Awareness**: Show all users viewing the appointment, not just editors
