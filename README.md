# Appointment Editing Locking Mechanism Task

## Objective
Implement a locking mechanism to prevent concurrent edits on an appointment. Only one user can edit at a time, while others can only view. The UI must reflect the lock status and current editor.

## Requirements

### Backend (Node.js/TypeScript)
1. **Locking System**
   - Create a REST/WebSocket endpoint to acquire/release locks on appointments
   - Store lock metadata (lockedBy, appointmentId, timestamp)
   - Auto-release locks after 5 minutes of inactivity
   - Handle concurrent lock requests gracefully

2. **APIs**
   - `GET /appointments/:id/lock-status` - Get current lock status
   - `POST /appointments/:id/acquire-lock` - Attempt to acquire lock
   - `DELETE /appointments/:id/release-lock` - Release existing lock
   - `WS /appointments/:id/updates` - Real-time lock/pointer updates (Bonus)

3. **Models**
   ```ts
   interface AppointmentLock {
     appointmentId: string;
     userId: string;
     userInfo: { name: string; email: string }; // Bonus: Add position data
     expiresAt: Date;
   }
   ```

### Frontend (React/TypeScript)
1. **Lock Awareness**
   - Show visual indicator when appointment is locked
   - Disable form inputs when not the lock owner
   - Display current editor's identity and lock timer

2. **Real-Time Updates**
   - Implement WebSocket connection for lock status changes
   - Show loading state during lock acquisition/release
   - (Bonus) Display other users' pointers using [aceternity Following Pointer](https://ui.aceternity.com/components/following-pointer)

3. **Takeover Feature**
   - Add "Request Control" button for admins
   - Force release lock after confirmation (admin-only)
   - Handle takeover conflicts gracefully

## Technical Expectations
1. **Concurrency Control**
   - Use optimistic locking or versioning for data integrity
   - Handle race conditions in lock acquisition
   - Implement proper error handling for lock conflicts

2. **State Management**
   - Use React Context/Redux for lock state
   - Sync frontend state with backend via WebSocket/REST
   - Handle tab/window close events to release locks

3. **Security**
   - Validate user permissions for lock operations
   - Sanitize WebSocket messages
   - Implement rate limiting for lock attempts

## Bonus Features
1. **Collaborative Cursors**
   - Broadcast mouse position via WebSocket
   - Display other users' cursors with aceternity animation
   - Throttle position updates for performance

2. **Admin Takeover**
   - Add admin role verification
   - Implement priority locking for admins
   - Add audit trail for forced takeovers

## Deliverables
1. Complete lock workflow implementation
2. Unit tests for critical paths (lock acquisition/conflict/resolution)
3. Documentation of architecture decisions
4. (Bonus) Animated cursor demonstration

## Evaluation Criteria
- Implementation completeness
- Handling of edge cases
- Code quality & TypeScript usage
- Real-time synchronization efficiency
- Error handling and user feedback
- Bonus feature implementation quality

## Suggested Tech Stack
- **Backend**: Node.js, Express, TypeORM/Prisma, WebSocket
- **Frontend**: React, TypeScript, React-Query, Zustand/Jotai
- **UI**: aceternity/ui for animated cursor, Tailwind CSS