# Filtering Debug Guide

## How to Test Filters

### 1. Open Browser Console
- Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
- Go to "Console" tab
- You should see filter logs when you apply filters

### 2. Test Drill-Down (Click on Chart)
1. Go to any analysis
2. Click on a bar in a bar chart
3. **Expected Console Output:**
   ```
   🔍 Filter computation started. Total rows: 10000
     Applying drill-down: City = New York
   ✅ Filtering complete. Filtered rows: 1234 (12.3%)
   ```
4. **Expected Visual Result:**
   - Blue chip appears: "City: New York" with X button
   - All charts should update to show only New York data
   - Row counter shows: "Showing 1,234 of 10,000 rows (filtered)"

### 3. Test Dimension Filters
1. Click "Show Filters" button
2. Select a value from any dropdown (e.g., Category = "Electronics")
3. **Expected Console Output:**
   ```
   🔍 Filter computation started. Total rows: 10000
     Applying filter: Category IN [Electronics]
   ✅ Filtering complete. Filtered rows: 2500 (25.0%)
   ```
4. **Expected Visual Result:**
   - Gray chip appears: "Category: Electronics"
   - Charts update
   - Data Grid shows filtered rows

### 4. Test Date Range
1. Click "Show Filters"
2. Select a date column
3. Pick start and end dates
4. **Expected Console Output:**
   ```
   🔍 Filter computation started. Total rows: 10000
     Applying date filter: OrderDate between 2024-01-01 and 2024-03-31
   ✅ Filtering complete. Filtered rows: 2500 (25.0%)
   ```

## Troubleshooting

### Issue: Filters show but charts don't update

**Check Console for:**
1. Are filter logs appearing? If NO → Filter state not updating
2. Is filtered row count changing? If NO → Filter logic broken
3. Are there errors in console? If YES → Check error message

**Common Causes:**
- **Chart title doesn't match pattern**: Charts need titles like "Sales by City" or "Revenue by Category"
- **Column names don't match**: Filter uses exact column names from data
- **No data in filtered result**: Try less restrictive filters

### Issue: Console shows "Error recomputing chart data"

**This means:**
- Chart title parsing failed
- Column names in title don't match actual columns
- SQL query syntax error

**Fix:**
- Check chart title format (should be "Measure by Dimension")
- Verify column names match exactly (case-sensitive)
- Check console for specific error message

### Issue: Filters apply but charts show original data

**This means:**
- `getFilteredChartData()` is returning `opt.data` (fallback)
- Check if `filteredData.length === localData.length` (no actual filtering)

**Fix:**
- Verify filter is actually reducing row count in console
- Check if chart key is updating: `key={charts-${filteredData.length}}`

## Expected Behavior Summary

✅ **Working Correctly:**
- Console shows filter logs
- Filtered row count decreases
- Filter chips appear
- Charts visually change
- Data Grid shows fewer rows
- SQL Runner queries filtered data

❌ **Not Working:**
- No console logs → State not updating
- Row count stays same → Filter logic broken
- Charts don't change → Re-render not triggered
- Errors in console → Check error message

## Quick Fix Checklist

1. ✅ Open console and look for filter logs
2. ✅ Click on a chart bar - does console show drill-down?
3. ✅ Does filtered row count change?
4. ✅ Do filter chips appear?
5. ✅ Do charts visually update?

If ANY of these fail, share the console output and I'll debug further!
