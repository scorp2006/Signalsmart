package com.signalsafe

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.CellInfo
import android.telephony.CellInfoGsm
import android.telephony.CellInfoLte
import android.telephony.CellInfoNr
import android.telephony.CellInfoWcdma
import android.telephony.CellSignalStrengthNr
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap

/**
 * Exposes the device's REAL cellular signal strength (RSRP/dBm) to JavaScript.
 *
 * Returns { dbm, level, radio }. If the value is unavailable (permission denied, no SIM, OS
 * restriction, or an older API level), fields are null — the app then falls back to a clearly
 * labelled estimate. This module never fabricates a reading.
 */
class SignalStrengthModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SignalStrength"

    @ReactMethod
    fun getSignalStrength(promise: Promise) {
        val ctx = reactApplicationContext
        val result = Arguments.createMap()
        result.putNull("dbm")
        result.putNull("level")
        result.putNull("radio")

        val hasPhone = ContextCompat.checkSelfPermission(
            ctx, Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED
        val hasLoc = ContextCompat.checkSelfPermission(
            ctx, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasPhone || !hasLoc) {
            // Not an error — just unavailable. JS falls back to estimate.
            promise.resolve(result)
            return
        }

        try {
            val tm = ctx.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            @Suppress("MissingPermission")
            val cells: List<CellInfo>? = tm.allCellInfo

            var bestDbm: Int? = null
            var bestLevel: Int? = null
            var radio: String? = null

            cells?.forEach { info ->
                if (!info.isRegistered) return@forEach
                when (info) {
                    is CellInfoLte -> {
                        val ss = info.cellSignalStrength
                        bestDbm = ss.dbm
                        bestLevel = ss.level
                        radio = "LTE"
                    }
                    is CellInfoGsm -> {
                        if (radio == null) {
                            val ss = info.cellSignalStrength
                            bestDbm = ss.dbm
                            bestLevel = ss.level
                            radio = "GSM"
                        }
                    }
                    is CellInfoWcdma -> {
                        if (radio == null) {
                            val ss = info.cellSignalStrength
                            bestDbm = ss.dbm
                            bestLevel = ss.level
                            radio = "UMTS"
                        }
                    }
                    else -> {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && info is CellInfoNr) {
                            val ss = info.cellSignalStrength as? CellSignalStrengthNr
                            if (ss != null) {
                                bestDbm = ss.dbm
                                bestLevel = ss.level
                                radio = "NR"
                            }
                        }
                    }
                }
            }

            // dbm == Integer.MAX_VALUE means "unknown" from the Android API.
            if (bestDbm != null && bestDbm != Int.MAX_VALUE) {
                result.putInt("dbm", bestDbm!!)
            }
            if (bestLevel != null) result.putInt("level", bestLevel!!)
            if (radio != null) result.putString("radio", radio)
        } catch (e: SecurityException) {
            // leave nulls
        } catch (e: Exception) {
            // leave nulls
        }

        promise.resolve(result)
    }
}
