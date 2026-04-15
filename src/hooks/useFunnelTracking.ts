import { useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const getSessionId = () => {
  let sid = sessionStorage.getItem("funnel_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("funnel_session_id", sid);
  }
  return sid;
};

export const useFunnelTracking = () => {
  const sessionId = useRef(getSessionId());

  const track = useCallback(async (eventType: string, page?: string, metadata?: Record<string, any>) => {
    try {
      await supabase.from("funnel_events").insert({
        event_type: eventType,
        page: page || window.location.pathname,
        session_id: sessionId.current,
        metadata: metadata || {},
      } as any);
    } catch (e) {
      console.error("Funnel tracking error:", e);
    }
  }, []);

  return { track, sessionId: sessionId.current };
};

export const usePageView = (page: string) => {
  const { track } = useFunnelTracking();
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      track("page_view", page);
    }
  }, [track, page]);
};
