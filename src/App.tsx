import React from 'react';
import { ALL_CONFIG_STREAMS } from './config/siteConfig';
import { useMultiwatch } from './hooks/useMultiwatch';
import { Header } from './components/Header';
import { RosterDrawer } from './components/RosterDrawer';
import { StreamGrid } from './components/StreamGrid';
import { ChatDrawer } from './components/ChatDrawer';
import { Toast } from './components/Toast';

export const App: React.FC = () => {
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
  } = useMultiwatch();

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-ninja-950 text-slate-100">
      {/* Slim Top Command Bar */}
      <Header
        activeVillage={activeVillage}
        streams={streams}
        allConfigStreams={ALL_CONFIG_STREAMS}
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

      {/* Main Workspace: Collapsible Roster + Video Canvas + Chat Rail */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        <RosterDrawer
          isOpen={isRosterOpen}
          onClose={() => setIsRosterOpen(false)}
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

      {/* Notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default App;
