import React, { useEffect, useState } from 'react';
import { ALL_CONFIG_STREAMS, StreamItem } from './config/siteConfig';
import { fetchStreamers } from './services/streamerService';
import { useMultiwatch } from './hooks/useMultiwatch';
import { useAppRoute } from './hooks/useAppRoute';
import { Header } from './components/Header';
import { RosterDrawer } from './components/RosterDrawer';
import { StreamGrid } from './components/StreamGrid';
import { ChatDrawer } from './components/ChatDrawer';
import { FanartPage } from './components/FanartPage';
import { Toast } from './components/Toast';

export const App: React.FC = () => {
  const { route, navigate } = useAppRoute();
  const [rosterStreams, setRosterStreams] = useState<StreamItem[]>(ALL_CONFIG_STREAMS);

  useEffect(() => {
    let active = true;
    fetchStreamers().then(res => {
      if (active) {
        setRosterStreams(res.streams);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const {
    streams,
    statuses,
    isStatusLoading,
    refreshStatuses,
    activeVillage,
    layoutMode,
    isChatOpen,
    isRosterOpen,
    mutedStreams,
    soloStreamId,
    focusedStreamId,
    toast,
    isAllMuted,
    setLayoutMode,
    setIsChatOpen,
    setIsRosterOpen,
    focusStream,
    moveStream,
    swapStreams,
    setToast,
    selectVillage,
    addStream,
    addMultipleStreams,
    removeStream,
    clearAllStreams,
    toggleMute,
    soloAudio,
    muteAll,
    unmuteAll,
    shareLink,
  } = useMultiwatch(rosterStreams);

  useEffect(() => {
    if (route !== 'multiwatch') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'r') {
        e.preventDefault();
        setIsRosterOpen(prev => !prev);
        return;
      }
      if (key === 'c') {
        e.preventDefault();
        setIsChatOpen(prev => !prev);
        return;
      }
      if (key === 'm') {
        e.preventDefault();
        if (isAllMuted) {
          unmuteAll();
        } else {
          muteAll();
        }
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        setToast({
          id: `shortcuts-${Date.now()}`,
          message: 'Kısayollar: R Kadro · C Sohbet · M Sessiz · 1-9 Odakla · Shift+1-9 Solo',
          type: 'info',
        });
        return;
      }

      const digitMatch = /^Digit([1-9])$/.exec(e.code);
      if (digitMatch) {
        const index = Number(digitMatch[1]) - 1;
        const targetStream = streams[index];
        if (!targetStream) return;
        e.preventDefault();
        if (e.shiftKey) {
          soloAudio(targetStream.id);
        } else {
          focusStream(targetStream.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    route,
    streams,
    isAllMuted,
    setIsRosterOpen,
    setIsChatOpen,
    muteAll,
    unmuteAll,
    focusStream,
    soloAudio,
    setToast,
  ]);

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-ninja-950 text-slate-100">
      {/* Slim Top Command Bar */}
      <Header
        activeRoute={route}
        onNavigateRoute={navigate}
        activeVillage={activeVillage}
        streams={streams}
        allConfigStreams={rosterStreams}
        statuses={statuses}
        isStatusLoading={isStatusLoading}
        layoutMode={layoutMode}
        isChatOpen={isChatOpen}
        isRosterOpen={isRosterOpen}
        isAllMuted={isAllMuted}
        onRefreshStatuses={refreshStatuses}
        onSelectVillage={selectVillage}
        onAddStream={addStream}
        onRemoveStream={removeStream}
        onAddMultipleStreams={addMultipleStreams}
        onChangeLayout={setLayoutMode}
        onMuteAll={muteAll}
        onUnmuteAll={unmuteAll}
        onClearAll={clearAllStreams}
        onToggleChat={() => setIsChatOpen(prev => !prev)}
        onToggleRoster={() => setIsRosterOpen(prev => !prev)}
        onShareLink={shareLink}
      />

      {/* Main Workspace */}
      {route === 'multiwatch' ? (
        <div className="flex-1 min-h-0 flex overflow-hidden relative">
          <RosterDrawer
            isOpen={isRosterOpen}
            onClose={() => setIsRosterOpen(false)}
            rosterStreams={rosterStreams}
            activeStreams={streams}
            statuses={statuses}
            isStatusLoading={isStatusLoading}
            mutedStreams={mutedStreams}
            soloStreamId={soloStreamId}
            focusedStreamId={focusedStreamId}
            onRefreshStatuses={refreshStatuses}
            onAddStream={addStream}
            onRemoveStream={removeStream}
            onSelectVillage={selectVillage}
            onClearAll={clearAllStreams}
            onToggleMute={toggleMute}
            onSoloAudio={soloAudio}
            onFocusStream={focusStream}
          />

          <main className="flex-1 min-h-0 flex flex-col min-w-0 overflow-hidden bg-ninja-950">
            <StreamGrid
              streams={streams}
              rosterStreams={rosterStreams}
              statuses={statuses}
              isStatusLoading={isStatusLoading}
              layoutMode={layoutMode}
              mutedStreams={mutedStreams}
              soloStreamId={soloStreamId}
              focusedStreamId={focusedStreamId}
              onToggleMute={toggleMute}
              onSoloAudio={soloAudio}
              onRemoveStream={removeStream}
              onFocusStream={focusStream}
              onMoveStream={moveStream}
              onSwapStreams={swapStreams}
              onOpenRoster={() => setIsRosterOpen(true)}
              onLoadVillage={selectVillage}
              onAddStream={addStream}
              onAddMultipleStreams={addMultipleStreams}
            />
          </main>

          <ChatDrawer
            isOpen={isChatOpen}
            streams={streams}
            onClose={() => setIsChatOpen(false)}
          />
        </div>
      ) : (
        <FanartPage
          mode={route === 'admin' ? 'admin' : 'fanart'}
          rosterStreams={rosterStreams}
          onStreamersChange={setRosterStreams}
          onNavigate={navigate}
          onNotify={setToast}
        />
      )}

      {/* Notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default App;
