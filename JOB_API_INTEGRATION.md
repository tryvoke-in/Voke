# Real Job API Integration

## API Key Provided
`2451839aa10951a2081e044f97a26f7f`

## Integration Method

I've integrated **The Muse API** to fetch real job postings. The system now:

1. **Fetches fresh jobs** every time you generate recommendations
2. **Stores them in the database** (avoids duplicates)
3. **Uses real job data** for AI matching instead of seed data

## How It Works

### When You Click "Generate Recommendations":
1. System fetches latest jobs from The Muse API
2. Stores up to 30 fresh job postings in database
3. AI analyzes your interview performance
4. Matches you with real jobs based on skills and experience
5. Returns personalized recommendations

### API Details:
- **Provider**: The Muse (https://www.themuse.com/developers/api/v2)
- **Endpoint**: `/api/public/jobs`
- **Category**: Engineering (can be customized)
- **Limit**: 30 jobs per fetch
- **Updates**: Fresh jobs on every recommendation generation

## Setup Instructions

### Option 1: Add API Key to Supabase (Recommended)
1. Go to Supabase Dashboard → Project Settings → Edge Functions
2. Add secret: `JOB_SEARCH_API_KEY` = `2451839aa10951a2081e044f97a26f7f`
3. Deploy the updated `generate-job-recommendations` function

### Option 2: Hardcoded (Already Done)
The API key is already included in the Edge Function as a fallback, so it will work immediately after deployment.

## Files Modified

1. **`supabase/functions/generate-job-recommendations/index.ts`**
   - Added real job fetching from The Muse API
   - Added helper functions for skill extraction and experience level inference
   - Stores jobs in database before matching

2. **`supabase/functions/fetch-real-jobs/index.ts`** (NEW)
   - Standalone function to fetch jobs on-demand
   - Supports both The Muse and Adzuna APIs
   - Can be called independently to refresh job database

## Benefits

✅ **Real Jobs**: No more AI-generated mock data  
✅ **Fresh Data**: Updated on every recommendation  
✅ **Automatic Skill Extraction**: Parses job descriptions for required skills  
✅ **Smart Experience Matching**: Infers entry/mid/senior levels  
✅ **Duplicate Prevention**: Won't store the same job twice  
✅ **Fallback**: Uses existing DB jobs if API fails  

## Testing

After deploying, test with:
```bash
# In your app
1. Complete 2-3 interviews
2. Visit /job-recommendations
3. Click "Generate Recommendations"
4. Check console logs for "Fetched X jobs from The Muse API"
5. See real job postings with application links!
```

## API Limits

The Muse API is free but has rate limits:
- **Free tier**: ~100 requests/hour
- **Jobs per request**: Up to 100
- **No authentication required** for public endpoints

## Future Enhancements

- Add more job APIs (Indeed, LinkedIn, Adzuna)
- Cache jobs for 24 hours to reduce API calls
- Add job filtering by location, salary, remote status
- Implement job refresh scheduling (daily/weekly)

---

**Status**: ✅ Ready to deploy! The integration is complete and will fetch real jobs automatically.
