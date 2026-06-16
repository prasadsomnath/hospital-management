import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Calendar, FileText, Pill, CreditCard, Bell, Trash2, CheckSquare } from "lucide-react-native";
import COLORS from "../../constants/colors";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { useNotifications } from "../../hooks/useNotifications";
import { getRelativeDateString } from "../../utils/date.utils";

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  const handleNotificationPress = async (item: typeof notifications[0]) => {
    // Mark as read in store
    await markAsRead(item.id);
    
    // Perform deep link redirect
    if (item.screenPath) {
      if (item.meta?.reportId) {
        router.push(`/lab/report-detail?id=${item.meta.reportId}` as any);
      } else if (item.meta?.billId) {
        router.push(`/billing/detail?id=${item.meta.billId}` as any);
      } else if (item.meta?.appointmentId) {
        router.push(`/appointment/detail?id=${item.meta.appointmentId}` as any);
      } else {
        router.push(item.screenPath as any);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "APPOINTMENT":
      case "TOKEN":
      case "FOLLOW_UP":
        return { icon: Calendar, color: COLORS.primary, bg: COLORS.primaryLight };
      case "REPORT":
      case "DISCHARGE":
        return { icon: FileText, color: "#8B5CF6", bg: "#F5F3FF" };
      case "MEDICINE":
        return { icon: Pill, color: COLORS.success, bg: "#ECFDF5" };
      case "BILL":
      default:
        return { icon: CreditCard, color: COLORS.accent, bg: "rgba(249, 115, 22, 0.08)" };
    }
  };

  // Group notifications manually
  const groupNotifications = () => {
    const today: typeof notifications = [];
    const yesterday: typeof notifications = [];
    const earlier: typeof notifications = [];

    notifications.forEach((n) => {
      const rel = getRelativeDateString(n.timestamp);
      if (rel === "Today") today.push(n);
      else if (rel === "Yesterday") yesterday.push(n);
      else earlier.push(n);
    });

    const sections = [];
    if (today.length > 0) sections.push({ title: "Today", data: today });
    if (yesterday.length > 0) sections.push({ title: "Yesterday", data: yesterday });
    if (earlier.length > 0) sections.push({ title: "Earlier", data: earlier });

    return sections;
  };

  const sections = groupNotifications();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        
        {notifications.length > 0 && (
          <View style={styles.headerActions}>
            <TouchableOpacity activeOpacity={0.7} onPress={markAllAsRead} style={styles.headerBtn}>
              <CheckSquare size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={clearAll} style={[styles.headerBtn, { marginLeft: 14 }]}>
              <Trash2 size={16} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Grouped Notifications List */}
      {sections.length === 0 ? (
        isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : (
          <View style={styles.emptyWrap}>
            <EmptyState
              iconName="Bell"
              title="All caught up!"
              description="No new notifications. Alerts for your lab reports, token queues, and prescriptions will appear here."
            />
          </View>
        )
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {sections.map((sec, secIdx) => (
            <View key={secIdx} style={styles.section}>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
              
              {sec.data.map((item) => {
                const { icon: Icon, color, bg } = getIcon(item.type);
                
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.9}
                    onPress={() => handleNotificationPress(item)}
                    style={[styles.itemCard, !item.isRead && styles.itemCardUnread]}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: bg }]}>
                      <Icon size={16} color={color} />
                    </View>
                    
                    <View style={styles.meta}>
                      <Text style={[styles.itemTitle, !item.isRead && styles.bold]}>
                        {item.title}
                      </Text>
                      <Text style={styles.itemBody}>{item.body}</Text>
                      <Text style={styles.time}>
                        {new Date(item.timestamp).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>

                    {/* Unread Blue Dot */}
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemCardUnread: {
    borderColor: "rgba(26, 111, 232, 0.15)",
    backgroundColor: COLORS.white,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  meta: {
    flex: 1,
    paddingRight: 10,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  bold: {
    fontWeight: "800",
  },
  itemBody: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 16,
    fontWeight: "500",
  },
  time: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: "700",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  emptyWrap: {
    padding: 20,
    marginTop: 40,
  },
});
