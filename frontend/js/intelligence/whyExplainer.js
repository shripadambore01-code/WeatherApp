/**
 * Atmos Weather — "Why is this happening?" Educational Insights Engine
 * Provides plain-language meteorological explanations grounded in real live telemetry.
 */

export function explainMeteorologicalMetric(metricKey, currentData = {}, hourlyData = [], aqiData = {}) {
    const temp = currentData.temperature_2m ?? 25;
    const feels = currentData.apparent_temperature ?? temp;
    const rh = currentData.relative_humidity_2m ?? 60;
    const pressure = currentData.pressure_msl ?? currentData.surface_pressure ?? 1013;
    const wind = currentData.wind_speed_10m ?? 10;
    const rainProb = currentData.precipitation_probability ?? 0;
    const uv = currentData.uv_index ?? 4;
    const aqi = aqiData?.current?.us_aqi ?? 35;

    switch (metricKey) {
        case 'feels_like':
        case 'humidity': {
            const diff = feels - temp;
            if (diff >= 2 && rh >= 65) {
                return {
                    title: `Why does it feel ${Math.round(feels)}°C when actual temperature is ${Math.round(temp)}°C?`,
                    explanation: `High relative humidity (${Math.round(rh)}%) prevents sweat from evaporating efficiently from your skin. When evaporation slows down, your body retains metabolic heat, creating a warmer thermal sensation (Heat Index effect).`,
                    keyFactor: `Relative Humidity at ${Math.round(rh)}%`,
                    action: 'Stay hydrated and wear breathable, light-colored cotton or moisture-wicking fabrics.'
                };
            } else if (diff <= -2 && wind >= 15) {
                return {
                    title: `Why does it feel ${Math.round(feels)}°C (cooler than ${Math.round(temp)}°C)?`,
                    explanation: `Active wind speeds (${Math.round(wind)} km/h) strip away the thin boundary layer of warm air insulating your skin (Wind Chill effect), accelerating convective cooling.`,
                    keyFactor: `Wind Speed at ${Math.round(wind)} km/h`,
                    action: 'Wear a wind-resistant outer layer to block convective heat loss.'
                };
            }
            return {
                title: `Why is humidity at ${Math.round(rh)}%?`,
                explanation: `Current moisture levels reflect prevailing air masses and atmospheric dew point. Moderate moisture levels provide comfortable breathing with steady skin evaporation rates.`,
                keyFactor: `Relative Humidity: ${Math.round(rh)}%`,
                action: 'Conditions are balanced for normal indoor and outdoor comfort.'
            };
        }

        case 'pressure': {
            if (pressure < 1008) {
                return {
                    title: `Why is barometric pressure low (${Math.round(pressure)} hPa)?`,
                    explanation: `A low-pressure system indicates rising warm air that draws in surrounding moisture, promoting condensation, cloud formation, and potential precipitation or storms.`,
                    keyFactor: `Barometric Pressure: ${Math.round(pressure)} hPa (Low System)`,
                    action: 'Keep an umbrella handy as low pressure frequently precedes rain.'
                };
            } else if (pressure > 1018) {
                return {
                    title: `Why is barometric pressure high (${Math.round(pressure)} hPa)?`,
                    explanation: `A high-pressure ridge causes dense air to sink gently toward the surface, suppressing cloud formation and producing stable, clear, sunny skies.`,
                    keyFactor: `Barometric Pressure: ${Math.round(pressure)} hPa (High Ridge)`,
                    action: 'Enjoy clear visibility and stable outdoor conditions.'
                };
            }
            return {
                title: `What does ${Math.round(pressure)} hPa pressure mean?`,
                explanation: `Atmospheric pressure is in a normal steady equilibrium (~1013 hPa), signifying stable regional meteorological patterns.`,
                keyFactor: `Barometric Pressure: ${Math.round(pressure)} hPa`,
                action: 'No abrupt storm fronts or barometric headaches expected.'
            };
        }

        case 'uv': {
            return {
                title: `Why is Ultraviolet Radiance at UV ${uv.toFixed(1)}?`,
                explanation: `UV intensity depends on the sun's angle (solar elevation) and atmospheric cloud filtration. High solar elevation near noon delivers direct solar radiation through the atmosphere.`,
                keyFactor: `Solar UV Index: ${uv.toFixed(1)}`,
                action: uv >= 6 ? 'Apply SPF 30+ sunscreen, wear UV400 sunglasses, and seek shade during peak midday hours.' : 'UV levels are safe for standard brief exposure.'
            };
        }

        case 'rain': {
            return {
                title: `Why is rain probability at ${Math.round(rainProb)}%?`,
                explanation: `Meteorological models calculate rain probability by evaluating atmospheric moisture saturation, dew point convergence, and updrafts capable of condensing vapor into water droplets.`,
                keyFactor: `Precipitation Risk: ${Math.round(rainProb)}%`,
                action: rainProb >= 40 ? 'Carry an umbrella or rain poncho when commuting.' : 'Skies are expected to remain mostly dry.'
            };
        }

        case 'aqi': {
            return {
                title: `Why is Air Quality Index at ${Math.round(aqi)}?`,
                explanation: `AQI is driven by fine particulate matter (PM2.5 / PM10), vehicle emissions (NO₂), and ozone (O₃) suspended in the air. Low wind or temperature inversions can trap pollutants near ground level.`,
                keyFactor: `US AQI: ${Math.round(aqi)}`,
                action: aqi > 100 ? 'Sensitive groups should limit prolonged strenuous outdoor exercise.' : 'Air quality is favorable for outdoor workouts.'
            };
        }

        default:
            return {
                title: 'Meteorological Overview',
                explanation: `Current atmospheric parameters are dynamically measured by verified satellite and ground radar stations.`,
                keyFactor: 'Real-time Telemetry',
                action: 'Check Atmos AI recommendations for personalized planning.'
            };
    }
}
