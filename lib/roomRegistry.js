"use client";

import { useEffect, useState, useRef } from "react";
import { getSupabase } from "./supabase";

/**
 * Hook to discover public rooms via Supabase Presence on "lobby-registry" channel.
 * Returns { rooms, loading } where rooms is an array of active public room info.
 */
export function useRoomRegistry() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase.channel("lobby-registry");

    function updateRooms() {
      const state = channel.presenceState();
      const roomList = [];
      for (const key of Object.keys(state)) {
        const presences = state[key];
        if (presences && presences.length > 0) {
          // Take the latest presence for this key
          const room = presences[presences.length - 1];
          if (room.isPublic) {
            roomList.push({
              roomId: room.roomId || key,
              hostName: room.hostName || "Host",
              playerCount: room.playerCount || 1,
              maxPlayers: room.maxPlayers || 8,
              phase: room.phase || "lobby",
            });
          }
        }
      }
      setRooms(roomList);
      setLoading(false);
    }

    channel
      .on("presence", { event: "sync" }, updateRooms)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setLoading(false);
          updateRooms();
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, []);

  return { rooms, loading };
}
