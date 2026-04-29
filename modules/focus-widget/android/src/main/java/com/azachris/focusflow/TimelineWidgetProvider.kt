package com.azachris.focusflow

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.graphics.*
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject
import java.util.*

class TimelineWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        val views = RemoteViews(context.packageName, R.layout.timeline_widget_layout)
        
        // 1. Carichiamo i dati
        val prefs = context.getSharedPreferences("FocusFlowWidget", Context.MODE_PRIVATE)
        val jsonStr = prefs.getString("activities", "[]")
        val activities = try { JSONArray(jsonStr) } catch (e: Exception) { JSONArray() }

        // 2. Troviamo attività Corrente e Prossima
        val calendar = Calendar.getInstance()
        val now = calendar.get(Calendar.HOUR_OF_DAY) + calendar.get(Calendar.MINUTE) / 60f
        
        var currentAct: JSONObject? = null
        var nextAct: JSONObject? = null
        var minNextDiff = Float.MAX_VALUE

        for (i in 0 until activities.length()) {
            val act = activities.getJSONObject(i)
            val start = act.getDouble("startHour").toFloat()
            val end = act.getDouble("endHour").toFloat()

            if (now in start..end) {
                currentAct = act
            } else if (start > now && (start - now) < minNextDiff) {
                nextAct = act
                minNextDiff = (start - now).toFloat()
            }
        }

        // 3. Aggiorniamo i testi
        if (currentAct != null) {
            views.setTextViewText(R.id.current_activity_title, currentAct.getString("title"))
            try {
                val color = Color.parseColor(currentAct.getString("color"))
                views.setInt(R.id.current_activity_color, "setBackgroundColor", color)
            } catch (e: Exception) {}
        } else {
            views.setTextViewText(R.id.current_activity_title, "Tempo Libero")
            views.setInt(R.id.current_activity_color, "setBackgroundColor", Color.GRAY)
        }

        if (nextAct != null) {
            val start = nextAct.getDouble("startHour")
            val h = start.toInt()
            val m = ((start - h) * 60).toInt()
            val timeStr = String.format("%02d:%02d", h, m)
            views.setTextViewText(R.id.next_activity_info, "${nextAct.getString("title")} alle $timeStr")
        } else {
            views.setTextViewText(R.id.next_activity_info, "Fine giornata")
        }

        // 4. Disegniamo l'orologio
        val bitmap = drawTimeline(activities, now)
        views.setImageViewBitmap(R.id.widget_canvas, bitmap)

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun drawTimeline(activities: JSONArray, now: Float): Bitmap {
        val size = 500
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        
        val center = size / 2f
        val radius = size * 0.40f
        val rect = RectF(center - radius, center - radius, center + radius, center + radius)

        // Sfondo Orologio
        paint.color = Color.parseColor("#1A1A1A")
        paint.style = Paint.Style.FILL
        canvas.drawCircle(center, center, radius, paint)
        
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 2f
        paint.color = Color.parseColor("#333333")
        canvas.drawCircle(center, center, radius, paint)

        // Archi attività
        paint.strokeWidth = 35f
        paint.strokeCap = Paint.Cap.ROUND
        for (i in 0 until activities.length()) {
            try {
                val act = activities.getJSONObject(i)
                val start = act.getDouble("startHour").toFloat()
                val end = act.getDouble("endHour").toFloat()
                val colorStr = act.getString("color")

                val startAngle = (start / 24f * 360f) - 90f
                var sweepAngle = ((end - start) / 24f * 360f)
                if (sweepAngle < 0) sweepAngle += 360f

                paint.color = Color.parseColor(colorStr)
                canvas.drawArc(rect, startAngle, sweepAngle, false, paint)
            } catch (e: Exception) {}
        }

        // Indicatore ora corrente
        val nowPos = now / 24f * 360f - 90f
        paint.color = Color.parseColor("#C8F04A")
        paint.strokeWidth = 6f
        val stopX = center + (radius + 15) * Math.cos(Math.toRadians(nowPos.toDouble())).toFloat()
        val stopY = center + (radius + 15) * Math.sin(Math.toRadians(nowPos.toDouble())).toFloat()
        canvas.drawLine(center, center, stopX, stopY, paint)

        return bitmap
    }
}
