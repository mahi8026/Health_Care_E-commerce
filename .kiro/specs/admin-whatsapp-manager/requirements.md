# Requirements Document

## Introduction

The Admin WhatsApp Conversation Manager is a frontend interface for the MedCore BD admin team to manage customer WhatsApp inquiries. The backend WhatsApp integration (models, controllers, webhook) is fully implemented. This feature bridges the operational gap by providing admin users with a dashboard to view conversations, respond to customers, and manage inquiry workflows.

**Business Context**: MedCore BD receives customer inquiries via WhatsApp for product information, order status, quotes, and support. Without a frontend interface, the admin team cannot access or respond to these conversations, blocking customer support operations.

**Technical Context**: The backend provides WhatsAppConversation and WhatsAppMessage models, whatsappController with full CRUD operations, and an active webhook receiving messages from WhatsApp Business API.

## Glossary

- **Admin_Dashboard**: The existing Next.js admin interface at /admin route
- **Conversation_List**: The paginated list view of all WhatsApp conversations
- **Conversation_Detail**: The detailed view showing message history and customer context
- **Message_Thread**: The chronological sequence of messages within a conversation
- **Customer_Context_Panel**: The sidebar displaying customer profile, orders, and related data
- **WhatsApp_API**: The backend Express.js API endpoints for WhatsApp operations
- **Admin_User**: A user with admin role who has access to the admin dashboard
- **Regular_Customer**: A non-admin user who should not access this interface
- **Conversation_Status**: The state of a conversation (active, resolved, pending, escalated, closed)
- **Message_Direction**: Whether a message is inbound (from customer) or outbound (from admin)
- **Bengali_Text**: UTF-8 encoded Bengali language content in messages

## Requirements

### Requirement 1: Conversation List Display

**User Story:** As an admin user, I want to view all WhatsApp conversations in a paginated list, so that I can see which customers have contacted us and prioritize responses.

#### Acceptance Criteria

1. WHEN an admin user navigates to /admin/whatsapp, THE Admin_Dashboard SHALL display the Conversation_List with pagination controls
2. THE Conversation_List SHALL display phoneNumber, customerName, status, category, lastMessageAt, and messageCount for each conversation
3. THE Conversation_List SHALL sort conversations by lastMessageAt in descending order (most recent first)
4. THE Conversation_List SHALL display 20 conversations per page by default
5. WHEN a conversation has unread inbound messages, THE Conversation_List SHALL display a visual indicator (badge or highlight)
6. THE Conversation_List SHALL render Bengali_Text correctly in preview snippets
7. WHEN the Conversation_List contains more than 20 conversations, THE Admin_Dashboard SHALL display pagination controls (previous, next, page numbers)

### Requirement 2: Conversation Filtering and Search

**User Story:** As an admin user, I want to filter and search conversations by customer, status, category, and date, so that I can quickly find specific conversations.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL provide filter controls for status (active, resolved, pending, escalated, closed)
2. THE Admin_Dashboard SHALL provide filter controls for category (product_inquiry, order_status, quote_request, complaint, support, general, b2b_inquiry, payment_issue, delivery_issue, return_request, other)
3. THE Admin_Dashboard SHALL provide a search input field for phoneNumber and customerName
4. WHEN an admin user enters text in the search field, THE Admin_Dashboard SHALL filter conversations where phoneNumber or customerName contains the search text (case-insensitive)
5. WHEN an admin user selects a status filter, THE Conversation_List SHALL display only conversations matching that status
6. WHEN an admin user selects a category filter, THE Conversation_List SHALL display only conversations matching that category
7. WHEN multiple filters are applied, THE Admin_Dashboard SHALL apply all filters using AND logic
8. THE Admin_Dashboard SHALL provide a "Clear Filters" control to reset all filters to default state

### Requirement 3: Conversation Detail View

**User Story:** As an admin user, I want to view the complete message history of a conversation, so that I can understand the customer's inquiry and context.

#### Acceptance Criteria

1. WHEN an admin user clicks a conversation in the Conversation_List, THE Admin_Dashboard SHALL navigate to /admin/whatsapp/[conversationId] and display the Conversation_Detail view
2. THE Conversation_Detail SHALL display the Message_Thread in chronological order (oldest first)
3. THE Message_Thread SHALL visually distinguish inbound messages from outbound messages using alignment and styling
4. THE Message_Thread SHALL display message content, timestamp, and status (queued, sent, delivered, read, failed) for each message
5. THE Message_Thread SHALL render Bengali_Text correctly in message content
6. THE Message_Thread SHALL display media messages (image, document, audio, video) with appropriate previews or download links
7. WHEN a message has status "failed", THE Message_Thread SHALL display the errorMessage
8. THE Message_Thread SHALL auto-scroll to the most recent message when the view loads
9. THE Conversation_Detail SHALL display conversation metadata (phoneNumber, customerName, status, category, assignedTo, createdAt, lastMessageAt)

### Requirement 4: Send Message to Customer

**User Story:** As an admin user, I want to send text messages to customers from the admin panel, so that I can respond to inquiries without using a separate WhatsApp interface.

#### Acceptance Criteria

1. THE Conversation_Detail SHALL provide a message input field and send button
2. WHEN an admin user types text in the message input field, THE Admin_Dashboard SHALL accept Bengali_Text input correctly
3. WHEN an admin user clicks the send button with non-empty message text, THE Admin_Dashboard SHALL call the WhatsApp_API POST /api/whatsapp/send endpoint with to (phoneNumber), text, and sentBy (admin user ID)
4. WHEN the WhatsApp_API returns success, THE Message_Thread SHALL display the new outbound message immediately with status "queued"
5. WHEN the WhatsApp_API returns an error, THE Admin_Dashboard SHALL display an error notification with the error message
6. WHEN a message is sent successfully, THE Admin_Dashboard SHALL clear the message input field
7. THE message input field SHALL support multi-line text input
8. THE send button SHALL be disabled when the message input field is empty or contains only whitespace

### Requirement 5: Update Conversation Status

**User Story:** As an admin user, I want to mark conversations as resolved or change their status, so that I can track which inquiries have been handled.

#### Acceptance Criteria

1. THE Conversation_Detail SHALL provide a status dropdown control with options (active, resolved, pending, escalated, closed)
2. WHEN an admin user selects a new status from the dropdown, THE Admin_Dashboard SHALL call the WhatsApp_API PUT /api/whatsapp/conversations/:id/status endpoint
3. WHEN the status is changed to "resolved", THE WhatsApp_API SHALL set resolvedAt to the current timestamp
4. WHEN the status is changed to "closed", THE WhatsApp_API SHALL set closedAt to the current timestamp
5. WHEN the WhatsApp_API returns success, THE Conversation_Detail SHALL update the displayed status immediately
6. WHEN the WhatsApp_API returns an error, THE Admin_Dashboard SHALL display an error notification and revert the status dropdown to the previous value

### Requirement 6: Display Customer Context

**User Story:** As an admin user, I want to see customer profile information and related orders alongside the conversation, so that I can provide personalized support.

#### Acceptance Criteria

1. THE Conversation_Detail SHALL display a Customer_Context_Panel adjacent to the Message_Thread
2. WHEN the conversation has a linked user, THE Customer_Context_Panel SHALL display user name, email, and phone from the User model
3. WHEN the conversation has a relatedOrder, THE Customer_Context_Panel SHALL display order number, status, and total amount
4. WHEN the conversation has a relatedQuote, THE Customer_Context_Panel SHALL display quote number and status
5. WHEN the conversation has relatedProducts, THE Customer_Context_Panel SHALL display product names and images
6. THE Customer_Context_Panel SHALL provide clickable links to view full order details, quote details, and product pages
7. WHEN the conversation has no linked user, THE Customer_Context_Panel SHALL display only the phoneNumber and customerName

### Requirement 7: Assign Conversation to Agent

**User Story:** As an admin user, I want to assign conversations to specific team members, so that inquiries are routed to the appropriate support agent.

#### Acceptance Criteria

1. THE Conversation_Detail SHALL provide an "Assign To" dropdown control listing all admin users
2. WHEN an admin user selects an agent from the dropdown, THE Admin_Dashboard SHALL call the WhatsApp_API PUT /api/whatsapp/conversations/:id/assign endpoint with userId
3. WHEN the WhatsApp_API returns success, THE Conversation_Detail SHALL display the assigned agent name and assignedAt timestamp
4. WHEN a conversation is assigned, THE WhatsApp_API SHALL set isBot to false
5. THE Conversation_List SHALL display the assignedTo agent name for assigned conversations

### Requirement 8: Add Internal Notes

**User Story:** As an admin user, I want to add internal notes to conversations, so that I can document important context for other team members.

#### Acceptance Criteria

1. THE Conversation_Detail SHALL provide an "Add Note" button and note input field
2. WHEN an admin user enters text in the note input field and clicks "Add Note", THE Admin_Dashboard SHALL call the WhatsApp_API POST /api/whatsapp/conversations/:id/notes endpoint with text and addedBy (admin user ID)
3. THE Conversation_Detail SHALL display all notes with text, addedBy user name, and addedAt timestamp
4. THE notes SHALL be visually distinct from the Message_Thread (different styling or separate section)
5. THE notes SHALL be visible only to admin users, not to customers

### Requirement 9: Access Control

**User Story:** As a system administrator, I want to ensure only admin users can access the WhatsApp manager, so that customer conversations remain secure.

#### Acceptance Criteria

1. WHEN a Regular_Customer attempts to navigate to /admin/whatsapp, THE Admin_Dashboard SHALL redirect to /login
2. WHEN an unauthenticated user attempts to navigate to /admin/whatsapp, THE Admin_Dashboard SHALL redirect to /login
3. WHEN an Admin_User navigates to /admin/whatsapp, THE Admin_Dashboard SHALL display the Conversation_List
4. THE WhatsApp_API endpoints SHALL require authentication and admin role authorization
5. WHEN a non-admin user attempts to call WhatsApp_API endpoints, THE WhatsApp_API SHALL return 403 Forbidden status

### Requirement 10: Real-time Message Updates (Future Enhancement)

**User Story:** As an admin user, I want to see new incoming messages without manually refreshing, so that I can respond to customers promptly.

#### Acceptance Criteria

1. THE Conversation_Detail SHALL poll the WhatsApp_API GET /api/whatsapp/conversations/:id endpoint every 10 seconds to check for new messages
2. WHEN new messages are detected, THE Message_Thread SHALL append the new messages to the display
3. WHEN new messages are detected, THE Admin_Dashboard SHALL play a notification sound (optional, user-configurable)
4. THE Conversation_List SHALL poll the WhatsApp_API GET /api/whatsapp/conversations endpoint every 30 seconds to update conversation metadata
5. WHEN the admin user is actively typing a message, THE Admin_Dashboard SHALL pause polling to avoid interrupting input

### Requirement 11: Message Type Support

**User Story:** As an admin user, I want to view different message types (text, images, documents, location), so that I can understand all customer communications.

#### Acceptance Criteria

1. WHEN a message has type "text", THE Message_Thread SHALL display the text content
2. WHEN a message has type "image", THE Message_Thread SHALL display the image preview using mediaUrl or mediaId
3. WHEN a message has type "document", THE Message_Thread SHALL display the filename and provide a download link
4. WHEN a message has type "audio", THE Message_Thread SHALL display an audio player control
5. WHEN a message has type "video", THE Message_Thread SHALL display a video player control
6. WHEN a message has type "location", THE Message_Thread SHALL display the locationName, locationAddress, and coordinates
7. WHEN a message has type "interactive" with buttonId, THE Message_Thread SHALL display the buttonText
8. WHEN a message has caption (for image, video, document), THE Message_Thread SHALL display the caption below the media

### Requirement 12: Conversation Analytics Dashboard

**User Story:** As an admin manager, I want to view analytics on WhatsApp conversations, so that I can monitor team performance and customer inquiry trends.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL provide a /admin/whatsapp/analytics route
2. THE analytics page SHALL display total conversation count for the selected date range
3. THE analytics page SHALL display conversations grouped by status (active, resolved, pending, escalated, closed)
4. THE analytics page SHALL display conversations grouped by category (product_inquiry, order_status, quote_request, etc.)
5. THE analytics page SHALL display bot vs human conversation counts
6. THE analytics page SHALL display total message count and messages by direction (inbound, outbound)
7. THE analytics page SHALL display average response time in minutes
8. THE analytics page SHALL provide date range filter controls (today, last 7 days, last 30 days, custom range)
9. WHEN an admin user selects a date range, THE Admin_Dashboard SHALL call the WhatsApp_API GET /api/whatsapp/analytics endpoint with startDate and endDate parameters

### Requirement 13: Mobile Responsive Design

**User Story:** As an admin user on mobile, I want to access WhatsApp conversations from my phone, so that I can respond to urgent inquiries while away from my desk.

#### Acceptance Criteria

1. THE Conversation_List SHALL adapt layout for mobile screens (width < 768px) using responsive design
2. THE Conversation_Detail SHALL adapt layout for mobile screens by stacking the Message_Thread and Customer_Context_Panel vertically
3. THE message input field SHALL remain accessible and usable on mobile keyboards
4. THE filter controls SHALL collapse into a mobile-friendly drawer or accordion on small screens
5. THE Admin_Dashboard SHALL use touch-friendly button sizes (minimum 44x44px) for all interactive elements
6. THE Message_Thread SHALL scroll smoothly on mobile touch devices

### Requirement 14: Error Handling and Loading States

**User Story:** As an admin user, I want clear feedback when operations fail or data is loading, so that I understand the system state.

#### Acceptance Criteria

1. WHEN the Conversation_List is loading data, THE Admin_Dashboard SHALL display a loading spinner or skeleton UI
2. WHEN the WhatsApp_API returns an error for GET /api/whatsapp/conversations, THE Admin_Dashboard SHALL display an error message with retry option
3. WHEN the WhatsApp_API returns an error for POST /api/whatsapp/send, THE Admin_Dashboard SHALL display an error notification with the error message
4. WHEN the network connection is lost, THE Admin_Dashboard SHALL display a "Connection Lost" notification
5. WHEN a message send operation is in progress, THE send button SHALL display a loading indicator and be disabled
6. WHEN the Conversation_Detail is loading, THE Admin_Dashboard SHALL display a loading spinner

### Requirement 15: Conversation Category Management

**User Story:** As an admin user, I want to categorize conversations by inquiry type, so that I can route them to specialized team members.

#### Acceptance Criteria

1. THE Conversation_Detail SHALL provide a category dropdown control with options (product_inquiry, order_status, quote_request, complaint, support, general, b2b_inquiry, payment_issue, delivery_issue, return_request, other)
2. WHEN an admin user selects a new category, THE Admin_Dashboard SHALL call the WhatsApp_API PUT /api/whatsapp/conversations/:id endpoint to update the category field
3. THE Conversation_List SHALL display the category for each conversation
4. THE Conversation_List filter SHALL allow filtering by category
5. THE analytics page SHALL display conversation counts grouped by category
