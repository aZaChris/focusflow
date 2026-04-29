package com.azachris.focusflow

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import androidx.work.*
import java.util.concurrent.TimeUnit

class FocusWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FocusWidget")

    Function("updateWidget") { activitiesJson: String ->
      val context = appContext.reactContext ?: return@Function
      
      // 1. Salvataggio dati
      val prefs = context.getSharedPreferences("FocusFlowWidget", Context.MODE_PRIVATE)
      prefs.edit().putString("activities", activitiesJson).apply()
      
      // 2. Aggiornamento Immediato
      val intent = Intent(context, TimelineWidgetProvider::class.java)
      intent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
      val ids = AppWidgetManager.getInstance(context)
        .getAppWidgetIds(ComponentName(context, TimelineWidgetProvider::class.java))
      intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
      context.sendBroadcast(intent)

      // 3. Programmazione Aggiornamenti Periodici (Fallback)
      val workRequest = PeriodicWorkRequestBuilder<WidgetUpdateWorker>(15, TimeUnit.MINUTES)
        .setConstraints(Constraints.NONE)
        .build()
      
      WorkManager.getInstance(context).enqueueUniquePeriodicWork(
        "WidgetUpdateWork",
        ExistingPeriodicWorkPolicy.KEEP,
        workRequest
      )
    }

    Function("requestPinAppWidget") {
      val context = appContext.reactContext ?: return@Function
      val appWidgetManager = AppWidgetManager.getInstance(context)
      val myProvider = ComponentName(context, TimelineWidgetProvider::class.java)

      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
        if (appWidgetManager.isRequestPinAppWidgetSupported) {
          appWidgetManager.requestPinAppWidget(myProvider, null, null)
        }
      }
    }
  }
}
