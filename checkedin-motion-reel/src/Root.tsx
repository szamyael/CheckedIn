import { Composition, Folder } from "remotion";
import {
  CommunityScene,
  FinaleScene,
  LiveScene,
  LocationScene,
  OfflineScene,
  OpeningScene,
  ScanScene,
  Showreel,
} from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CheckedIn-Showreel"
        component={Showreel}
        durationInFrames={45 * 30}
        fps={30}
        width={1920}
        height={1080}
      />
      <Folder name="Scenes">
        <Composition
          id="Opening"
          component={OpeningScene}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ style: { backgroundColor: "#07142e" } }}
        />
        <Composition
          id="Scan"
          component={ScanScene}
          durationInFrames={180}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ style: { backgroundColor: "#eaf2f8" } }}
        />
        <Composition
          id="Location"
          component={LocationScene}
          durationInFrames={210}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ style: { backgroundColor: "#07142e" } }}
        />
        <Composition
          id="Live"
          component={LiveScene}
          durationInFrames={210}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ style: { backgroundColor: "#eaf2f8" } }}
        />
        <Composition
          id="Offline"
          component={OfflineScene}
          durationInFrames={180}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ style: { backgroundColor: "#07142e" } }}
        />
        <Composition
          id="Community"
          component={CommunityScene}
          durationInFrames={210}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ style: { backgroundColor: "#eaf2f8" } }}
        />
        <Composition
          id="Finale"
          component={FinaleScene}
          durationInFrames={210}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ style: { backgroundColor: "#07142e" } }}
        />
      </Folder>
    </>
  );
};
