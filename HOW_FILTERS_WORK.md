# 🎯 How Filters Work in Nalyse

## Filter Logic Explained

### ✅ **OR Logic (Within Same Column)**
When you select multiple values for the **same column**, they use **OR** logic:

**Example:**
- Filter: `City = New York` OR `City = Los Angeles`
- **Result:** Shows rows where City is EITHER New York OR Los Angeles
- **Row Count:** Increases (more inclusive)

### ❌ **AND Logic (Across Different Columns)**
When you select values from **different columns**, they use **AND** logic:

**Example:**
- Filter 1: `City = New York`
- Filter 2: `Category = Electronics`
- Filter 3: `Status = Active`
- **Result:** Shows rows where ALL three conditions are true
- **Row Count:** Decreases (more restrictive)

## 🚨 Common Issue: 0 Rows Result

### Why This Happens:
You applied too many filters across different columns, creating an impossible combination.

**Example of 0 Rows:**
```
Customer Id = 6d350C5E5eDB4EE
AND Company = Richardson Group
AND City = East Kristintown
AND First Name = Kristina
AND Last Name = Ferrell
```

This means: "Show me rows where the customer ID is X **AND** the company is Y **AND** the city is Z **AND**..."

If no single row matches ALL these conditions, you get 0 results.

### How to Fix:
1. **Click "Clear All"** to reset filters
2. **Start with fewer filters** (1-2 at a time)
3. **Use filters strategically:**
   - Start broad (e.g., City = New York)
   - Then narrow down (e.g., + Category = Electronics)
   - Check row count after each filter

## 📊 Best Practices

### ✅ DO:
- **Start with 1-2 filters** and add more gradually
- **Check the row count** after each filter (shown in blue chip)
- **Use drill-down** (click on charts) for quick single-value filtering
- **Remove filters** that don't reduce the dataset meaningfully

### ❌ DON'T:
- **Don't apply 5+ filters at once** - you'll likely get 0 rows
- **Don't select the same value twice** - it's redundant
- **Don't mix incompatible filters** (e.g., City=NYC AND City=LA won't work across columns)

## 🎓 Filter Workflow Examples

### Example 1: Sales Analysis by Region
1. Click "Show Filters"
2. Select `Region = West` → See 2,500 rows
3. Add `Product = Laptop` → See 450 rows
4. Add `Quarter = Q1` → See 120 rows
5. ✅ Result: West region laptop sales in Q1

### Example 2: Customer Segmentation
1. Click on "Premium" segment in pie chart (drill-down)
2. See all Premium customers (1,200 rows)
3. Add filter: `City = New York` → See 300 rows
4. ✅ Result: Premium customers in New York

### Example 3: Time-Based Analysis
1. Click "Show Filters"
2. Select Date Column: `OrderDate`
3. Start Date: `2024-01-01`
4. End Date: `2024-03-31`
5. ✅ Result: All orders in Q1 2024

## 🔍 Understanding the Filter Display

### Filter Chip Colors:
- **🔵 Blue Chip** = Drill-down (from clicking a chart)
- **⚪ Gray Chip** = Manual filter (from dropdown)
- **Each chip shows:** `Column: Value`

### Row Counter:
- **"Showing 1,234 of 10,000 rows"**
  - 1,234 = Filtered rows (what you see)
  - 10,000 = Total rows (original dataset)
  - Percentage shown in console

### Clear Filters:
- **X on individual chip** = Remove that specific filter
- **"Clear All" button** = Remove all filters at once

## 💡 Pro Tips

1. **Use Drill-Down for Quick Filtering**
   - Click any bar or pie slice
   - Instantly filters to that value
   - Faster than using dropdowns

2. **Combine Filters Strategically**
   - Start with the most restrictive filter first
   - Add broader filters to expand results if needed

3. **Watch the Console**
   - Open browser console (F12)
   - See exactly which filters are applied
   - Helps debug why you got 0 rows

4. **Date Ranges Are Powerful**
   - Great for time-series analysis
   - Combine with other filters for period-specific insights

## 🐛 Troubleshooting

### "I got 0 rows!"
- **Solution:** Click "Clear All" and start over with fewer filters
- **Check:** Are you filtering on columns that don't overlap?

### "Filters aren't working!"
- **Check console:** Do you see filter logs?
- **Verify:** Are filter chips appearing?
- **Try:** Click "Clear All" and test with one filter

### "Same value appears twice!"
- **Fixed:** Duplicate values are now prevented
- **If you see this:** Refresh the page

---

**Remember:** Filtering is about finding the right balance between being specific enough to get insights, but not so restrictive that you filter out all your data!
