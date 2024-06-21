import { Button, Form, Input } from 'antd';
import { memo, useRef, useState } from 'react';
import WebRTC from '@ewents/rtc';
import style from './index.module.scss';
import { useParams } from 'react-router-dom';

const peers = new Map<number, MediaStream>([
  [1, null],
  [2, null],
]);

const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: false,
});

export const Media = memo(() => {
  const [_, render] = useState<number>();
  const [connected1, setConnected1] = useState(false);
  const [connected2, setConnected2] = useState(false);
  const [hostStream, setHostStream] = useState<MediaStream | null>(null);

  const { id } = useParams();
  const peer1 = useRef(
    new WebRTC({
      baseUrl: 'ws://localhost:3001',
      clientKey: '66760d2b14813c0e8b53b4ff X',
      peerId: id,
      onReceiveMediaStream: ({ type, stream }) => {
        if (type === 'host') {
          setHostStream(stream);
        } else if (type === 'remote') {
          peers.set(1, stream);
        }
        render(new Date().getTime());
      },
    }),
  );

  const peer2 = useRef(
    new WebRTC({
      baseUrl: 'ws://localhost:3001',
      clientKey: '66760d2b14813c0e8b53b4ff x',
      peerId: id,
      onReceiveMediaStream: ({ type, stream }) => {
        if (type === 'host') {
          setHostStream(stream);
        } else if (type === 'remote') {
          peers.set(2, stream);
        }
        render(new Date().getTime());
      },
    }),
  );

  const [form1] = Form.useForm();
  const [form2] = Form.useForm();

  const onSubmit1 = ({ peerId }) => peer1.current.startConnection(peerId);
  const onSubmit2 = ({ peerId }) => peer2.current.startConnection(peerId);

  peer1.current.onConnectionStateChange((state) =>
    setConnected1(state === 'connected'),
  );
  peer2.current.onConnectionStateChange((state) =>
    setConnected2(state === 'connected'),
  );

  const startVideo = async (peer: WebRTC) => {
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      peer.setMediaTrack(videoTrack, stream);
    }
  };

  const stopVideo = (peer: WebRTC) => {
    peer.getMediaTrack('video').enabled = !peer.getMediaTrack('video').enabled;
  };

  return (
    <div className={style.form}>
      {!connected1 && (
        <Form layout="vertical" title="Peer1" form={form1} onFinish={onSubmit1}>
          <Form.Item name="peerId" label="Peer">
            <Input />
          </Form.Item>
          <Button htmlType="submit">CONNECT</Button>
        </Form>
      )}
      {!connected2 && (
        <Form layout="vertical" title="Peer2" form={form2} onFinish={onSubmit2}>
          <Form.Item name="peerId" label="Peer">
            <Input />
          </Form.Item>
          <Button htmlType="submit">CONNECT</Button>
        </Form>
      )}

      <div className={style.mediaControls}>
        <div>
          <p>Peer1</p>
        </div>
        <div>
          <Button onClick={() => startVideo(peer1.current)}>Start Video</Button>
          <Button onClick={() => stopVideo(peer1.current)}>Stop Video</Button>
        </div>
      </div>
      <div className={style.mediaControls}>
        <div>
          <p>Peer2</p>
        </div>
        <div>
          <Button onClick={() => startVideo(peer2.current)}>Start Video</Button>
          <Button onClick={() => stopVideo(peer2.current)}>Stop Video</Button>
        </div>
      </div>

      <div>
        <div className={style.videoContainers}>
          {hostStream && (
            <div className={style.videoContainer}>
              <video
                autoPlay
                controls
                ref={(video) => {
                  if (video) {
                    video.srcObject = hostStream;
                  }
                }}
              />
            </div>
          )}
        </div>
        <div className={style.videos}>
          <div>
            {peers.get(1) && (
              <div className={style.videoContainer}>
                <video
                  autoPlay
                  controls
                  ref={(video) => {
                    if (video) {
                      video.srcObject = peers.get(1);
                    }
                  }}
                />
              </div>
            )}
          </div>
          <div>
            {peers.get(2) && (
              <div className={style.videoContainer}>
                <video
                  autoPlay
                  controls
                  ref={(video) => {
                    if (video) {
                      video.srcObject = peers.get(2);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
