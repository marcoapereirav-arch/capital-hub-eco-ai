import { Composition } from 'remotion'
import {
  VerticalClean,
  VerticalCleanPropsSchema,
  defaultVerticalCleanProps,
  type VerticalCleanProps,
} from './compositions/VerticalClean'
import {
  MisionVivencias,
  MisionVivenciasPropsSchema,
  defaultMisionVivenciasProps,
} from './compositions/MisionVivencias'

/**
 * Punto de entrada de Remotion. Define las composiciones disponibles.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="vertical-clean"
        component={VerticalClean}
        durationInFrames={1800} // se sobreescribe por calculateMetadata
        fps={30}
        width={1080}
        height={1920}
        schema={VerticalCleanPropsSchema}
        defaultProps={defaultVerticalCleanProps}
        calculateMetadata={({ props }: { props: VerticalCleanProps }) => {
          // Duración real basada en la suma de duraciones de los segmentos
          const totalSeconds = props.segments.reduce(
            (acc: number, s: { duration: number }) => acc + s.duration,
            0,
          )
          return {
            durationInFrames: Math.max(30, Math.ceil(totalSeconds * 30)),
            fps: 30,
            width: 1080,
            height: 1920,
          }
        }}
      />

      <Composition
        id="mision-vivencias"
        component={MisionVivencias}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        schema={MisionVivenciasPropsSchema}
        defaultProps={defaultMisionVivenciasProps}
      />
    </>
  )
}
