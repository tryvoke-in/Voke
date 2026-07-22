# Video Interview Feature - Technical Documentation

## Overview
The Video Interview Practice feature allows users to record video responses to interview questions and receive AI-powered feedback on their delivery, body language, and overall performance.

## Architecture

### Frontend Components
1. **VideoInterview.tsx** - Main recording interface
2. **VideoInterviewResults.tsx** - Displays analysis results
3. **VideoPracticeHistory.tsx** - Lists all past sessions

### Backend Components
1. **analyze-video-interview** - Edge function for AI analysis
2. **video_interview_sessions** - Database table for session data
3. **video-interviews** - Storage bucket for video files

## Protocols & Standards

### 1. Video Recording Protocol

#### Browser API Usage
- **MediaDevices API**: Accesses camera and microphone
- **MediaRecorder API**: Records video stream
- **Supported Formats**: WebM (VP8/Opus codec)

#### Recording Flow
```
1. Request camera/microphone permissions
   └─> navigator.mediaDevices.getUserMedia()
   
2. Initialize MediaRecorder with stream
   └─> mimeType: 'video/webm;codecs=vp8,opus'
   
3. Capture data chunks
   └─> ondataavailable event handler
   
4. Stop recording and create blob
   └─> Blob(chunks, { type: 'video/webm' })
```

#### Video Configuration
- **Resolution**: 1280x720 (720p) ideal
- **Facing Mode**: User (front camera)
- **Audio**: Enabled with echo cancellation
- **Sample Rate**: 48kHz (default for Opus)

### 2. Storage Protocol

#### Bucket Configuration
- **Bucket Name**: `video-interviews`
- **Privacy**: Private (not publicly accessible)
- **File Size Limit**: 500MB (524,288,000 bytes)
- **Allowed MIME Types**: 
  - video/webm
  - video/mp4
  - video/quicktime

#### File Naming Convention
```
{user_id}/{session_id}.webm
```

#### Row Level Security (RLS)
- Users can only upload, view, and delete their own videos
- Path-based access control using `storage.foldername()`

### 3. AI Analysis Protocol

#### Analysis Process
1. **Video Upload**: Client uploads to Supabase Storage
2. **Session Creation**: Creates database record with metadata
3. **AI Processing**: Edge function analyzes the interview
4. **Results Storage**: Updates session with scores and feedback

#### Analysis Metrics
- **Delivery Score** (0-100): Speech clarity, pace, filler words
- **Body Language Score** (0-100): Posture, gestures, eye contact
- **Confidence Score** (0-100): Overall presence and assurance
- **Overall Score**: Average of the three metrics

#### AI Model Used
- **Model**: google/gemini-2.5-flash (via Lovable AI Gateway)
- **Purpose**: Generate comprehensive interview feedback
- **Input**: Question text, video duration, session metadata
- **Output**: JSON with scores, strengths, and improvements

### 4. Data Schema

#### video_interview_sessions Table
```sql
CREATE TABLE video_interview_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  question TEXT NOT NULL,
  video_url TEXT,
  duration_seconds INTEGER,
  analysis_result JSONB,
  feedback_summary TEXT,
  delivery_score INTEGER CHECK (0-100),
  body_language_score INTEGER CHECK (0-100),
  confidence_score INTEGER CHECK (0-100),
  overall_score INTEGER CHECK (0-100),
  status TEXT DEFAULT 'recording',
  created_at TIMESTAMPTZ DEFAULT now(),
  analyzed_at TIMESTAMPTZ
);
```

#### Session Status Flow
```
recording → uploading → analyzing → completed
```

### 5. Security Protocols

#### Authentication
- All endpoints require authenticated user
- Session tokens validated via Supabase Auth
- User ID extracted from JWT token

#### Authorization
- RLS policies enforce user-level isolation
- Users cannot access other users' videos or sessions
- Edge functions validate user ownership

#### Data Protection
- Videos stored in private bucket
- Signed URLs used for time-limited access
- HTTPS enforced for all transfers

### 6. Client-Side Implementation

#### Camera Access Flow
```javascript
const startCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "user"
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });
  
  videoRef.current.srcObject = stream;
};
```

#### Recording Implementation
```javascript
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp8,opus'
});

mediaRecorder.ondataavailable = (event) => {
  chunks.push(event.data);
};

mediaRecorder.onstop = () => {
  const blob = new Blob(chunks, { type: 'video/webm' });
  // Process blob
};
```

#### Upload Protocol
```javascript
// 1. Create session record
const { data: session } = await supabase
  .from('video_interview_sessions')
  .insert({ user_id, question, duration_seconds })
  .select()
  .single();

// 2. Upload video
const fileName = `${user_id}/${session.id}.webm`;
await supabase.storage
  .from('video-interviews')
  .upload(fileName, recordedBlob);

// 3. Trigger analysis
await supabase.functions.invoke('analyze-video-interview', {
  body: { sessionId: session.id, videoUrl, question }
});
```

### 7. Edge Function Implementation

#### Function Structure
<!-- ```typescript
serve(async (req) => {
  // 1. Parse request
  const { sessionId, question } = await req.json();
  
  // 2. Get session data
  const { data: session } = await supabase
    .from('video_interview_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  
  // 3. Call AI for analysis
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: analysisPrompt }]
    })
  });
  
  // 4. Parse AI response
  const analysis = JSON.parse(aiResponse);
  
  // 5. Update session with results
  await supabase
    .from('video_interview_sessions')
    .update({
      analysis_result: analysis,
      delivery_score: analysis.delivery_score,
      body_language_score: analysis.body_language_score,
      confidence_score: analysis.confidence_score,
      overall_score: analysis.overall_score,
      status: 'completed',
      analyzed_at: new Date().toISOString()
    })
    .eq('id', sessionId);
});
``` -->

### 8. Error Handling

#### Client-Side Errors
- Camera access denied → Show permission instructions
- Recording failure → Offer retry option
- Upload failure → Retry with exponential backoff
- Network errors → Display user-friendly messages

#### Server-Side Errors
- AI API rate limits → Queue for later processing
- Analysis timeouts → Fallback to simpler analysis
- Storage errors → Log and notify user
- Database errors → Transaction rollback

### 9. Performance Optimization

#### Video Compression
- WebM format provides good compression
- VP8 codec balance between quality and size
- Typical 2-minute video: ~10-30MB

#### Lazy Loading
- Video history loaded on demand
- Pagination for large session lists
- Thumbnail generation (future enhancement)

#### Caching
- Session results cached in browser
- Video URLs cached with signed URL expiry
- Analysis results stored in database

### 10. User Experience Guidelines

#### Recording Tips
- Position camera at eye level
- Ensure good lighting
- Minimize background noise
- Look at camera, not screen
- Speak clearly and at moderate pace
- Aim for 1-2 minutes per answer

#### UI/UX Features
- Real-time recording timer
- Preview before submission
- Retake option
- Loading states during analysis
- Progressive feedback display
- Score visualization with progress bars

## Future Enhancements

### Planned Features
1. **Frame Extraction**: Analyze actual video frames for body language
2. **Speech-to-Text**: Transcribe audio for content analysis
3. **Emotion Detection**: Analyze facial expressions
4. **Gaze Tracking**: Measure eye contact with camera
5. **Gesture Analysis**: Evaluate hand movements
6. **Background Analysis**: Check for professional setting
7. **Audio Quality**: Analyze voice clarity and tone
8. **Thumbnail Generation**: Create preview images
9. **Video Trimming**: Allow users to edit recordings
10. **Comparison View**: Compare sessions over time

### Technical Improvements
1. **Streaming Upload**: Upload while recording
2. **Video Compression**: Client-side compression
3. **Multiple Formats**: Support more video formats
4. **Resume Upload**: Handle interrupted uploads
5. **Background Processing**: Queue-based analysis
6. **Real-time Feedback**: Live analysis during recording
7. **Mobile Optimization**: Better mobile experience
8. **Offline Support**: Cache and sync later

## API Reference

### Edge Function: analyze-video-interview

#### Request
```json
{
  "sessionId": "uuid",
  "videoUrl": "string",
  "question": "string"
}
```

#### Response
```json
{
  "success": true,
  "analysis": {
    "delivery_score": 75,
    "body_language_score": 80,
    "confidence_score": 72,
    "overall_score": 76,
    "feedback_summary": "string",
    "strengths": ["string"],
    "improvements": ["string"]
  }
}
```

### Database Queries

#### Create Session
```typescript
await supabase
  .from('video_interview_sessions')
  .insert({
    user_id: user.id,
    question: question,
    duration_seconds: duration
  });
```

#### Get User Sessions
```typescript
await supabase
  .from('video_interview_sessions')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

#### Update Analysis Results
```typescript
await supabase
  .from('video_interview_sessions')
  .update({
    analysis_result: analysis,
    delivery_score: score,
    status: 'completed'
  })
  .eq('id', sessionId);
```

## Testing Guidelines

### Manual Testing Checklist
- [ ] Camera access works on different browsers
- [ ] Recording starts and stops correctly
- [ ] Video preview displays properly
- [ ] Upload progresses and completes
- [ ] Analysis runs and returns results
- [ ] Results display correctly
- [ ] Session history shows all recordings
- [ ] RLS prevents unauthorized access
- [ ] Error states display properly
- [ ] Mobile responsive design works

### Browser Compatibility
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅ (with limitations)
- Edge 90+ ✅
- Mobile browsers ⚠️ (varies by device)

## Troubleshooting

### Common Issues

**Camera not working**
- Check browser permissions
- Ensure HTTPS connection
- Try different browser
- Check device settings

**Upload failing**
- Check file size (<500MB)
- Verify internet connection
- Check storage quota
- Try smaller recording

**Analysis not completing**
- Check AI credits balance
- Verify edge function logs
- Check database connectivity
- Monitor function timeout

## Monitoring & Logs

### Key Metrics to Track
- Session creation rate
- Upload success rate
- Analysis completion time
- Average video duration
- Error rates by type
- User engagement metrics

### Log Points
- Video recording start/stop
- Upload progress
- Edge function invocation
- AI API calls
- Database operations
- Error occurrences

## Compliance & Privacy

### Data Retention
- Videos stored until user deletion
- Analysis results retained permanently
- User can delete sessions anytime
- Automatic cleanup after account deletion

### Privacy Considerations
- Videos are private by default
- No third-party access
- AI analysis is anonymous
- Complies with user consent requirements

## Support & Documentation

For questions or issues:
- Check documentation at `/docs`
- Review edge function logs
- Contact support team
- Report bugs via GitHub issues
