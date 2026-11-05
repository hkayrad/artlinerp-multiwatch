import React from 'react';
import { useMultiwatch } from './hooks/useMultiwatch';
import { Header } from './components/Header';
import { StreamGrid } from './components/StreamGrid';
import { ChatDrawer } from './components/ChatDrawer';
import { BottomBar } from './components/BottomBar';
import { StreamSelectorModal } from './components/StreamSelectorModal';
import { Toast } from './components/Toast';

export const App: React.FC = () => {
  const {
    streams,
    activeVillage,
    layoutMode,
    isChatOpen,
    isAddModalOpen,
    mutedStreams,
    soloStreamId,
    focusedStreamId,
    toast,
    isAllMuted,
    setLayoutMode,
    setIsChatOpen,
    setIsAddModalOpen,
    setFocusedStreamId,
    setToast,
    selectVillage,
    addStream,
    removeStream,
    clearAllStreams,
    toggleMute,
    soloAudio,
    muteAll,
    unmuteAll,
    shareLink,
  } = useMultiwatch();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-ninja-950 text-slate-100">
      {/* Üst Menü / Başlık */}
      <Header
        activeVillage={activeVillage}
        streamCount={streams.length}
        layoutMode={layoutMode}
        isChatOpen={isChatOpen}
        onSelectVillage={selectVillage}
        onChangeLayout={setLayoutMode}
        onToggleChat={() => setIsChatOpen(prev => !prev)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onShareLink={shareLink}
      />

      {/* Ana Gövde: Yayın Izgarası + Yan Sohbet Paneli */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gradient-to-b from-ninja-950 to-ninja-900">
          <StreamGrid
            streams={streams}
            layoutMode={layoutMode}
            mutedStreams={mutedStreams}
            soloStreamId={soloStreamId}
            focusedStreamId={focusedStreamId}
            onToggleMute={toggleMute}
            onSoloAudio={soloAudio}
            onRemoveStream={removeStream}
            onFocusStream={setFocusedStreamId}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onLoadVillage={(villageId) => selectVillage(villageId)}
          />
        </main>

        {/* Sohbet Çekmecesi */}
        <ChatDrawer
          isOpen={isChatOpen}
          streams={streams}
          onClose={() => setIsChatOpen(false)}
        />
      </div>

      {/* Alt Kontrol Çubuğu */}
      <BottomBar
        streamCount={streams.length}
        layoutMode={layoutMode}
        isAllMuted={isAllMuted}
        onChangeLayout={setLayoutMode}
        onMuteAll={muteAll}
        onUnmuteAll={unmuteAll}
        onClearAll={clearAllStreams}
        onShareLink={shareLink}
      />

      {/* Yayın Listesi ve Seçim Modalı */}
      <StreamSelectorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        activeStreams={streams}
        onAddStream={addStream}
        onRemoveStream={removeStream}
        onSelectVillage={selectVillage}
        onClearAll={clearAllStreams}
      />

      {/* Bildirim Toast'ı */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default App;
